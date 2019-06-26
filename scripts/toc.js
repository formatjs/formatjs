const {sync: globSync} = require('glob');
const {resolve} = require('path');
const toc = require('markdown-toc');
const {outputFileSync} = require('fs-extra');
const {readFileSync} = require('fs');
globSync(resolve(__dirname, '../docs/*.md')).forEach(fn => {
  console.log(`Adding TOC to ${fn}`);
  outputFileSync(fn, toc.insert(readFileSync(fn, 'utf-8'), {firsth1: false}));
});
