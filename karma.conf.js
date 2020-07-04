// eslint-disable-next-line @typescript-eslint/no-var-requires
const FILES = process.argv.slice(4);

module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', 'jasmine-matchers'],
    files: FILES,
    reporters: ['progress'],
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-jasmine-matchers',
    ],
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
  });
};
