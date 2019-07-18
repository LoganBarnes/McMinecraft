#include "minecraft_server.hpp"

// external
#include <grpcw/server/grpc_async_server.hpp>

// standard
#include <sstream>

namespace mcs {

MinecraftServer::MinecraftServer(unsigned port)
    : server_(std::make_unique<grpcw::server::GrpcAsyncServer<Service>>(std::make_shared<Service>(),
                                                                        "0.0.0.0:" + std::to_string(port))) {

    metadata_.set_total_blocks(world_.blocks().size());

    /*
     * Update Streams
     */
    metadata_stream_ = server_->register_async_stream(&Service::RequestMetadataUpdates,
                                                      [](const google::protobuf::Empty& /*ignored*/) {});
    update_stream_
        = server_->register_async_stream(&Service::RequestWorldUpdates,
                                         [this](const minecraft::ClientData& client) {
                                             // register client
                                             *metadata_.add_client_names() = client.name();
                                             metadata_stream_->write(metadata_);
                                         },
                                         [this](const minecraft::ClientData& client) {
                                             // unregister client
                                             auto* clients = metadata_.mutable_client_names();
                                             clients->erase(std::find(clients->begin(), clients->end(), client.name()),
                                                            clients->end());
                                             metadata_stream_->write(metadata_);
                                         });
    /*
     * World Modification Actions
     */
    server_->register_async(&Service::RequestModifyWorld,
                            [this](const minecraft::WorldActionRequest& request, minecraft::Result* result) {
                                return modify_world(request, result);
                            });
}

MinecraftServer::~MinecraftServer() = default;

grpc::Status MinecraftServer::modify_world(const minecraft::WorldActionRequest& request, minecraft::Result* result) {
    minecraft::WorldUpdate update;
    result->mutable_success(); // success by default

    switch (request.action_case()) {

    case minecraft::WorldActionRequest::kAddAdjacentBlock: {
        const minecraft::AddAdjacentBlockRequest& add_block_request = request.add_adjacent_block();
        auto error = world_.add_adjacent_block(add_block_request.existing_block(),
                                               add_block_request.adjacent_direction(),
                                               update.mutable_block_added());

        if (error.error_message().empty()) {
            update_stream_->write(update);

            metadata_.set_total_blocks(world_.blocks().size());
            metadata_stream_->write(metadata_);
        } else {
            *result->mutable_error() = error;
        }
        break;
    }

    case minecraft::WorldActionRequest::kRemoveExistingBlock:
        result->mutable_error()->set_error_message("Block removal not yet implemented");
        break;

    case minecraft::WorldActionRequest::ACTION_NOT_SET:
        result->mutable_error()->set_error_message("World modification action not specified");
        break;
    }

    return grpc::Status::OK;
}

} // namespace mcs
