import { Error, ClientReadableStream, Status } from 'grpc-web';
import { v4 as uuid } from 'uuid';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
// generated
import { WorldClient } from '@gen/WorldServiceClientPb';
import { WorldActionRequest, AddAdjacentBlockRequest } from '@gen/requests_pb';
import { ClientData, Errors, Result, Metadata } from '@gen/world_pb';
import { Block, IVec3, BlockFace } from '@gen/components_pb';
import { WorldUpdate, WorldState } from '@gen/updates_pb';

class MinecraftServer {
  private client: WorldClient = new WorldClient(
    'http://' + process.env.VUE_APP_PROXY_ADDRESS
  );
  private metadataStream: ClientReadableStream<Metadata> | null = null;
  private updateStream: ClientReadableStream<WorldUpdate>;
  private userMetadataCallback: (metadata: Metadata) => void;
  private userUpdateCallback: (update: WorldUpdate) => void;
  private userStatusCallback: (update: Status) => void;

  constructor(streamMetadata: boolean) {
    this.userMetadataCallback = (metadata: Metadata) => undefined; // empty
    this.userUpdateCallback = (update: WorldUpdate) => undefined; // empty
    this.userStatusCallback = (status: Status) => undefined; // empty

    // Set up the metadata stream
    if (streamMetadata) {
      this.metadataStream = this.client.metadataUpdates(new Empty());

      // this.metadataStream.on('error', this.processError.bind(this));
      this.metadataStream.on('data', this.processMetadata.bind(this));
      this.metadataStream.on('status', this.processStatus.bind(this));
      // this.metadataStream.on('end', this.processEndStream.bind(this));
    }

    // Get the initial state
    this.client.getCurrentState(
      new Empty(),
      null,
      (err: Error, response: WorldState) => {
        // TODO: Display errors instead of throwing
        if (err) {
          throw err;
        } else if (response) {
          const blocks = response.getBlocksList();
          const worldUpdate = new WorldUpdate();
          blocks.forEach((block: Block) => {
            worldUpdate.setBlockAdded(block);
            this.processUpdate(worldUpdate);
          });
        }
      }
    );

    // Set up the world update stream
    const id: string = uuid();
    const clientData: ClientData = new ClientData();
    clientData.setName(id);
    clientData.setSendExistingState(true);

    this.updateStream = this.client.worldUpdates(clientData);

    // this.updateStream.on('error', this.processError.bind(this));
    this.updateStream.on('data', this.processUpdate.bind(this));
    this.updateStream.on('status', this.processStatus.bind(this));
    // this.updateStream.on('end', this.processEndStream.bind(this));
  }

  public addBlock(existingBlockPosition: IVec3, blockFace: BlockFace) {
    const block: Block = new Block();
    block.setPosition(existingBlockPosition);

    const request: AddAdjacentBlockRequest = new AddAdjacentBlockRequest();
    request.setExistingBlock(block);
    request.setAdjacentDirection(blockFace);

    const action: WorldActionRequest = new WorldActionRequest();
    action.setAddAdjacentBlock(request);

    this.client.modifyWorld(action, null, (err: Error, response: Result) => {
      // TODO: Display errors instead of throwing
      if (err) {
        throw err;
      } else if (response) {
        switch (response.getResultCase()) {
          case Result.ResultCase.SUCCESS:
            return;

          case Result.ResultCase.ERROR:
            throw new Error((response.getError() as Errors).getErrorMessage());

          case Result.ResultCase.RESULT_NOT_SET:
            break;
        }
        throw new Error('Server response not set properly');
      }
    });
  }

  set metadataCallback(callback: (metadata: Metadata) => void) {
    this.userMetadataCallback = callback;
  }

  set updateCallback(callback: (update: WorldUpdate) => void) {
    this.userUpdateCallback = callback;
  }

  set statusCallback(callback: (status: Status) => void) {
    this.userStatusCallback = callback;
  }

  private processMetadata(metadata: Metadata): void {
    this.userMetadataCallback(metadata);
  }

  private processUpdate(update: WorldUpdate): void {
    this.userUpdateCallback(update);
  }

  // private processEndStream(): void {}

  private processStatus(status: Status): void {
    this.userStatusCallback(status);
  }
}

export default MinecraftServer;
