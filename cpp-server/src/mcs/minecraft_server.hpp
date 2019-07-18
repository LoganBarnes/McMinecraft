#pragma once

// project
#include "mcs/minecraft_world.hpp"

// generated
#include <world.grpc.pb.h>

// external
#include <grpcw/forward_declarations.hpp>

// standard
#include <unordered_map>

namespace mcs {

class MinecraftServer {
public:
    explicit MinecraftServer(unsigned port);
    ~MinecraftServer();

private:
    using Service = minecraft::World::AsyncService;
    std::unique_ptr<grpcw::server::GrpcAsyncServer<Service>> server_;

    // send back updates to clients
    grpcw::server::StreamInterface<minecraft::WorldUpdate>* update_stream_;
    grpcw::server::StreamInterface<minecraft::Metadata>* metadata_stream_;

    // TODO: make these thread safe
    minecraft::Metadata metadata_;
    MinecraftWorld world_;

    grpc::Status modify_world(const minecraft::WorldActionRequest& request, minecraft::Result* error);
};

} // namespace mcs
