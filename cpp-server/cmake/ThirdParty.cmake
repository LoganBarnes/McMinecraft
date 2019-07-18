include(FetchContent)

###################
### McMinecraft ###
###################
### Threads ###
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

### gRPC Wrapper Library ###
FetchContent_Declare(
        grpcw_dl
        GIT_REPOSITORY https://github.com/LoganBarnes/grpc-wrapper.git
        GIT_TAG master
)

FetchContent_GetProperties(grpcw_dl)
if (NOT grpcw_dl_POPULATED)
    FetchContent_Populate(grpcw_dl)

    add_subdirectory(${grpcw_dl_SOURCE_DIR} ${grpcw_dl_BINARY_DIR} EXCLUDE_FROM_ALL)
endif ()

###############
### Testing ###
###############
if (${MCS_BUILD_TESTS})
    ### DocTest ###
    FetchContent_Declare(doctest_dl
            GIT_REPOSITORY https://github.com/onqtam/doctest.git
            GIT_TAG 2.2.3
            )

    FetchContent_GetProperties(doctest_dl)
    if (NOT doctest_dl_POPULATED)
        FetchContent_Populate(doctest_dl)
    endif ()
endif ()