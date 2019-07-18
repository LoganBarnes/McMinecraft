// project
#include "mcs/minecraft_server.hpp"

// standard
#include <condition_variable>
#include <csignal>

namespace {

bool exit_server = false;
std::mutex mtx;
std::condition_variable block_until_signal;

void signal_handler(int /*signal*/) {
    std::lock_guard lock(mtx);
    std::cout << "\nCaught signal!" << std::endl;
    exit_server = true;
    block_until_signal.notify_one();
}

} // namespace

int main(int argc, const char* argv[]) {
    std::signal(SIGINT, signal_handler);

    unsigned port = 9090u;

    if (argc > 1) {
        port = static_cast<unsigned>(std::stoul(argv[1]));
    }

    mcs::MinecraftServer server(/*port=*/port);

    std::cout << "Server running on port '" << port << "'\n";
    std::cout << "'CTRL + C' to quit..." << std::flush;
    std::unique_lock lock(mtx);
    block_until_signal.wait(lock, [] { return exit_server; });
    std::cout << "Exiting." << std::endl;

    return 0;
}
