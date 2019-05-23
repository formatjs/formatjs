module.exports = function (config) {
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        console.log('Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.')
        process.exit(1)
    }

    // Browsers to run on Sauce Labs
    // Check out https://saucelabs.com/platforms for all browser/OS combos
    let customLaunchers
    if (process.env.TRAVIS_PULL_REQUEST) {
        customLaunchers = {
            sl_chrome: {
                base: 'SauceLabs',
                browserName: 'chrome',
                version: '74'
            },
        }
    } else {
        customLaunchers = {
            sl_safari: {
                base: 'SauceLabs',
                browserName: 'safari',
                version: '12'
            },
            sl_edge: {
                base: 'SauceLabs',
                browserName: 'edge',
                version: '16'
            },
            sl_chrome: {
                base: 'SauceLabs',
                browserName: 'chrome',
                version: '74'
            },
            sl_firefox: {
                base: 'SauceLabs',
                browserName: 'firefox',
                version: '67'
            },
            sl_ie_11: {
                base: 'SauceLabs',
                browserName: 'internet explorer',
                version: '11'
            }
        }
    }

    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [
            'tests/browser.js'
        ],
        reporters: ['progress', 'saucelabs'],
        port: 9876,
        colors: true,
        sauceLabs: {
            testName: 'intl-messageformat',
            build: process.env.TRAVIS_BUILD_ID,
            recordScreenshots: false,
            connectOptions: {
                port: 5757,
                logfile: 'sauce_connect.log'
            },
            public: 'public'
        },
        // Increase timeout in case connection in CI is slow
        captureTimeout: 120000,
        customLaunchers,
        browsers: Object.keys(customLaunchers),
        singleRun: true
    })
};