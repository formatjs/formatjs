#!/bin/bash

echo branch $TRAVIS_BRANCH
echo pull request $TRAVIS_PULL_REQUEST

if [[ "false" != "$TRAVIS_PULL_REQUEST" ]]; then
    echo "saucelabs testing does not work with pull requests"
    exit 0
fi

if [[ "x" == "x$SAUCE_USERNAME" ]]; then
    echo $0 "is missing env var SAUCE_USERNAME"
    exit 1
fi
if [[ "x" == "x$SAUCE_ACCESS_KEY" ]]; then
    echo $0 "is missing env var SAUCE_ACCESS_KEY"
    exit 1
fi

build=$$
if [[ "x" != "x$TRAVIS_BUILD_NUMBER" ]]; then
    build=$TRAVIS_BUILD_NUMBER
fi
echo build $build

echo
./node_modules/.bin/grunt sauce
