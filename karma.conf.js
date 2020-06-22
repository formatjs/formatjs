// eslint-disable-next-line @typescript-eslint/no-var-requires
const {sync: globSync} = require('glob');
const FILES = globSync('./packages/*/tests-karma/*.js');

module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', 'jasmine-matchers'],
    files: FILES,
    reporters: ['progress'],
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
