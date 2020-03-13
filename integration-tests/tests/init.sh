#!/bin/bash

# test the `jigs init` command

source ${TEST_UTILS}

FRESH_PROJECT=~/test-jigs-init
mkdir -p ${FRESH_PROJECT}
cd ${FRESH_PROJECT}

jigs init

ls
ls src

# could exhastively check each file. For now, just make sure the build works
jigs build || { sayFail "build failed in freshly-created project"; }
