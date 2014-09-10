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

# This is only needed if there are multiple `node_js` specified in `.travis.yml`
#
#   if [[ "x" != "x$TRAVIS_JOB_NUMBER" ]]; then
#       x=`echo $TRAVIS_JOB_NUMBER | cut -d. -f2`
#       if [[ "1" != "$x" ]]; then
#           echo $0 'only needs to run on the "first" (.1) travis job'
#           exit 0
#       fi
#   fi


build=$$
if [[ "x" != "x$TRAVIS_BUILD_NUMBER" ]]; then
    build=$TRAVIS_BUILD_NUMBER
fi
echo build $build
SAUCE_CAPS=";build=$build;record-video=false;capture-html=false;record-screenshots=false;command-timeout=60"


# suacelab accounts are often throttled, we need to be sure to only run three
# at a time (and yet report failure if any fail)
failures=0


echo
./node_modules/.bin/yeti \
    --caps "name=ie11;browserName=internet explorer;version=11;platform=Windows 8.1$SAUCE_CAPS" \
    --caps "name=ie10;browserName=internet explorer;version=10;platform=Windows 8$SAUCE_CAPS" \
    --caps "name=ie9;browserName=internet explorer;version=9;platform=Windows 7$SAUCE_CAPS" \
    --wd-url "http://$SAUCE_USERNAME:$SAUCE_ACCESS_KEY@ondemand.saucelabs.com/" \
    --hub "http://test.yuicode.com/" \
    tests/*.html
if [[ "x$?" != "x0" ]]; then failures=$(( $failures + 1 )); fi
sleep 5

# fails to even run tests:
#   --caps "name=ie8;browserName=internet explorer;version=8;platform=Windows 7$SAUCE_CAPS" \
echo
./node_modules/.bin/yeti \
    --caps "name=chrome31;browserName=chrome;version=31;platform=OS X 10.9$SAUCE_CAPS" \
    --caps "name=safari7;browserName=safari;version=7;platform=OS X 10.9$SAUCE_CAPS" \
    --wd-url "http://$SAUCE_USERNAME:$SAUCE_ACCESS_KEY@ondemand.saucelabs.com/" \
    --hub "http://test.yuicode.com/" \
    tests/*.html
if [[ "x$?" != "x0" ]]; then failures=$(( $failures + 1 )); fi
sleep 5

echo
./node_modules/.bin/yeti \
    --caps "name=firefox26;browserName=firefox;version=26;platform=Windows 8.1$SAUCE_CAPS" \
    --caps "name=android40;browserName=android;version=4.0;platform=Linux;device-orientation=portrait$SAUCE_CAPS" \
    --caps "name=iphone7;browserName=iphone;version=7;platform=OS X 10.9;device-orientation=portrait$SAUCE_CAPS" \
    --wd-url "http://$SAUCE_USERNAME:$SAUCE_ACCESS_KEY@ondemand.saucelabs.com/" \
    --hub "http://test.yuicode.com/" \
    tests/*.html
if [[ "x$?" != "x0" ]]; then failures=$(( $failures + 1 )); fi
sleep 5


echo
echo failed runs $failures
if [[ "x0" != "x$failures" ]]; then
    exit 1
fi
exit 0


