FROM ubuntu:16.04
LABEL maintainer="William Sember" \
      description="Image for integration testing jigs." \
      project="jigs"

## all root stuff

# install dependencies
RUN apt-get update
RUN apt-get clean
RUN apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN npm i -g semver

# add testing user
ARG TEST_USER=tester
ARG TEST_USER_HOME=/home/${TEST_USER}
RUN useradd --create-home --home-dir /home/${TEST_USER} --shell /bin/bash ${TEST_USER}

## all user stuff

USER ${TEST_USER}

WORKDIR ${TEST_USER_HOME}
# customize terminal
ADD colorize .
RUN cat colorize >> ${TEST_USER_HOME}/.bashrc
RUN rm colorize
# put user's .bin in the PATH
RUN echo "export PATH=\"\${PATH}:${TEST_USER_HOME}/.bin\"" >> ${TEST_USER_HOME}/.bashrc

# install example site
WORKDIR ${TEST_USER_HOME}
COPY --chown=tester example-site example-site/

# add jigs
# do this towards the end as it'll probably change often
WORKDIR ${TEST_USER_HOME}/jigs
# made the directory, make it owned by the TEST_USER...
USER root
RUN chown ${TEST_USER} ${TEST_USER_HOME}/jigs
USER ${TEST_USER}
COPY --chown=tester built-jigs/package.json .
COPY --chown=tester built-jigs/launch.js .
COPY --chown=tester built-jigs/package-lock.json .
# NOTE: we are grabbing the build, so whatever state the build is in that's what
# we'll bake into the container
COPY --chown=tester built-jigs/build build/
COPY --chown=tester built-jigs/configs configs/
COPY --chown=tester built-jigs/install-jigs .
COPY --chown=tester built-jigs/jigs .
# copy dependencies
# COPY --chown=tester built-jigs/node_modules .

# get current jigs version
RUN cat package.json | grep "\"version\"" | awk '{print $2}' | sed "s/\"//g" | sed s/,// > ${TEST_USER_HOME}/jigs-version

# install jigs deps
RUN npm install
# install jigs
RUN ./install-jigs

# write current jigs version into test site's jigs config
WORKDIR ${TEST_USER_HOME}/example-site
RUN cat jigs.config.js | sed "s/^  jigsVersion: .*$/  jigsVersion: \"$(cat ${TEST_USER_HOME}/jigs-version)\",/" > jigs.config.js

# add tests
# do this towards the end as it'll probably change often
WORKDIR ${TEST_USER_HOME}
COPY --chown=tester tests tests/

# default in this directory
WORKDIR ${TEST_USER_HOME}
