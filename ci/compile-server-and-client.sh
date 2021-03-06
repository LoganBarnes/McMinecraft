#!/usr/bin/env bash

set -e # fail script if any individual commands fail

# set cmake path and test version
export PATH=/deps/cmake/bin:$PATH
cmake --version

# install deps
apt update
apt install -y apt-transport-https

# yarn repo
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# node update
curl -sL https://deb.nodesource.com/setup_10.x | bash -

apt update
apt install -y lcov nodejs yarn

# build server
pushd cpp-server
function build_and_run {
    cmake -E make_directory $1
    cmake -E chdir $1 cmake -DCMAKE_BUILD_TYPE=$2 -DMCS_USE_DEV_FLAGS=ON -DMCS_BUILD_TESTS=ON ..
    cmake -E chdir $1 cmake --build . --parallel
    # cmake -E chdir $1 ./bin/mcs_tests
}

build_and_run cmake-build-debug Debug
build_and_run cmake-build-release Release

# explicitly run coverage build
# cmake -E chdir cmake-build-debug cmake --build . --target mcs_coverage
popd

# build client
pushd ts-client
yarn
# yarn generate # need to add protoc-gen-grpc-web to docker image first
# yarn build
popd
