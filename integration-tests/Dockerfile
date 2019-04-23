FROM ubuntu:16.04
LABEL maintainer="William Sember" \
      description="Image for integration testing forge." \
      project="forge"

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

# add forge
# do this towards the end as it'll probably change often
WORKDIR ${TEST_USER_HOME}/forge
# made the directory, make it owned by the TEST_USER...
USER root
RUN chown ${TEST_USER} ${TEST_USER_HOME}/forge
USER ${TEST_USER}
COPY --chown=tester built-forge/package.json .
COPY --chown=tester built-forge/package-lock.json .
# NOTE: we are grabbing the build, so whatever state the build is in that's what
# we'll bake into the container
COPY --chown=tester built-forge/build build/
COPY --chown=tester built-forge/configs configs/
COPY --chown=tester built-forge/install-forge .
COPY --chown=tester built-forge/forge .
# copy dependencies
# COPY --chown=tester built-forge/node_modules .

# get current forge version
RUN cat package.json | grep "\"version\"" | awk '{print $2}' | sed "s/\"//g" | sed s/,// > ${TEST_USER_HOME}/forge-version

# install forge deps
RUN npm install
# install forge
RUN ./install-forge

# write current forge version into test site's forge config
WORKDIR ${TEST_USER_HOME}/example-site
RUN cat forge.config.js | sed "s/^  forgeVersion: .*$/  forgeVersion: \"$(cat ${TEST_USER_HOME}/forge-version)\",/" > forge.config.js

# add tests
# do this towards the end as it'll probably change often
WORKDIR ${TEST_USER_HOME}
COPY --chown=tester tests tests/

# default in this directory
WORKDIR ${TEST_USER_HOME}
