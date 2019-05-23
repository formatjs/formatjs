module.exports = function(config) {
    config.set({
      frameworks: ['mocha', 'chai'],
      files: ['test/browser.js'],
      reporters: ['progress'],
      port: 9876,  // karma web server port
      colors: true,
      logLevel: config.LOG_INFO,
      browsers: ['ChromeHeadless'],
      autoWatch: false,
      singleRun: true,
      concurrency: Infinity
    })
  }