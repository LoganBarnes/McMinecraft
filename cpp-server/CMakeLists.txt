cmake_minimum_required(VERSION 3.12)
project(MinecraftServer LANGUAGES CXX)

option(MCS_USE_DEV_FLAGS "Compile with all the flags" OFF)

#############################
### Project Configuration ###
#############################
include(cmake/ClangTidy.cmake)
include(cmake/ThirdParty.cmake)

if (MSVC)
    add_definitions(-DNOMINMAX -D_CRT_SECURE_NO_WARNINGS) # silly microsoft
    set(SYSTEM_FLAGS /experimental:external /external:anglebrackets /external:W0)
endif ()

if (MCS_USE_DEV_FLAGS)
    if (NOT MSVC)
        set(MCS_COMPILE_FLAGS
                -Wall -Wextra -Werror -Wpedantic -Wunused -pedantic-errors -Winit-self
                -Wold-style-cast -Woverloaded-virtual -Wsign-conversion -Wshadow
                -Wmissing-declarations -Wmissing-include-dirs -Wno-unknown-pragmas
                )
    else ()
        set(MCS_COMPILE_FLAGS /WX)
    endif ()
endif ()

# "Glob is terrible/root of all evil" yeah yeah. CONFIGURE_DEPENDS in cmake 3.12
# helps to fix that and it is super useful when refactoring
cmake_policy(SET CMP0009 NEW)

###########################
### Protobuf Generation ###
###########################
create_proto_library(minecraft_protos
        ${CMAKE_CURRENT_LIST_DIR}/protos/minecraft
        ${CMAKE_BINARY_DIR}/generated/protos
        )

set_target_properties(
        minecraft_protos
        PROPERTIES
        CXX_STANDARD 17
        CXX_STANDARD_REQUIRED ON
        CXX_EXTENSIONS OFF
        POSITION_INDEPENDENT_CODE ON
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
        ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
)

##################
### ProtoScene ###
##################
file(GLOB_RECURSE MCS_SOURCE_FILES
        LIST_DIRECTORIES false
        CONFIGURE_DEPENDS
        ${CMAKE_CURRENT_LIST_DIR}/src/mcs/*
        )

add_executable(minecraft_server ${MCS_SOURCE_FILES})
target_link_libraries(minecraft_server
        PRIVATE minecraft_protos
        PRIVATE grpc-wrapper
        )
target_include_directories(minecraft_server PRIVATE ${CMAKE_CURRENT_LIST_DIR}/src)

target_compile_options(minecraft_server PRIVATE ${MCS_COMPILE_FLAGS})
set_target_properties(
        minecraft_server
        PROPERTIES
        CXX_STANDARD 17
        CXX_STANDARD_REQUIRED ON
        CXX_EXTENSIONS OFF
        POSITION_INDEPENDENT_CODE ON
        CXX_CLANG_TIDY "${DO_CLANG_TIDY}"
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
        ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
)