#!/bin/sh

export TEST_SITE=/home/tester/example-site
export JIGS_VERSION=$(cat /home/tester/jigs-version)
export PATH="${PATH}:/home/tester/.bin"

export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

# switch to the tests directory
cd $(dirname $0)

export TEST_UTILS=$(pwd)/utils/common.sh

# run tests
./versioning.sh

./init.sh
