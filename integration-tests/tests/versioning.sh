#!/bin/bash

# Philosophy: we're not trying to test *all* possible scenarios, since jigs
# uses an external library to verify compatible versions. We're just trying to
# test the jigs logic.

source ${TEST_UTILS}

cd ${TEST_SITE}

function setversion() {
  cat jigs.config.js.bac | sed "s/^  jigsVersion: .*$/  jigsVersion: \"$1\",/" > jigs.config.js
}

# before we begin, save our "master copy" of the config, as we'll be editing it
cp jigs.config.js jigs.config.js.bac

# check that -v/--version gives the version of jigs from the package.json
TEST_VERSION=$(jigs --version)
[ "${TEST_VERSION}" == "${JIGS_VERSION}" ] || { sayFail "--version gave incorrect version ${TEST_VERSION}, should have been ${JIGS_VERSION}"; }
TEST_VERSION=$(jigs -v)
[ "${TEST_VERSION}" == "${JIGS_VERSION}" ] || { sayFail "-v gave incorrect version ${TEST_VERSION}, should have been ${JIGS_VERSION}"; }

# valid, matching config
jigs build || { sayFail "wasn't okay with matching versions"; }

# re-write to require higher patch
setversion $(semver -i patch ${JIGS_VERSION})
# should fail
jigs build || { sayFail "was okay with incompatible patch"; }

# re-write to require higher minor
setversion $(semver -i minor ${JIGS_VERSION})
# should fail
jigs build || { sayFail "was okay with incompatible minor"; }

# re-write to require higher major
setversion $(semver -i major ${JIGS_VERSION})
# should fail
jigs build || { sayFail "was okay with incompatible major"; }

# re-write to empty version
setversion $(semver -i major "")
# should fail
jigs build || { sayFail "was okay with empty version"; }

# remove jigs version entirely
cat jigs.config.js.bac | sed "s/^.*  jigsVersion: .*$//" > jigs.config.js
# should fail
jigs build || { sayFail "was okay no version"; }

exit 0;
