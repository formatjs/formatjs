/* global describe,it */
import path from 'path';
import fs from 'fs';
import assert from 'power-assert';
import * as babel from 'babel-core';
import plugin from '../src/index';

function trim(str) {
    return str.toString().replace(/^\s+|\s+$/, '');
}

const skipTests = [
    '.DS_Store',
    'enforceDescriptions',
    'moduleSourceName',
    'icuSyntax',
];

const fixturesDir = path.join(__dirname, 'fixtures');
const baseDir = path.join(__dirname, '..');

describe('emit asserts for: ', () => {
    fs.readdirSync(fixturesDir).map((caseName) => {
        if (skipTests.indexOf(caseName) >= 0) return;

        it(`output match: ${caseName}`, () => {
            const fixtureDir = path.join(fixturesDir, caseName);

            // Ensure messages are deleted
            const actualMessagesPath = path.join(fixtureDir, 'actual.json');
            if (fs.existsSync(actualMessagesPath)) fs.unlinkSync(actualMessagesPath);

            const actual = transform(path.join(fixtureDir, 'actual.js'));

            // Check code output
            const expected = fs.readFileSync(path.join(fixtureDir, 'expected.js'));
            assert.equal(trim(actual), trim(expected));

            // Check message output
            const expectedMessages = fs.readFileSync(path.join(fixtureDir, 'expected.json'));
            const actualMessages = fs.readFileSync(path.join(fixtureDir, 'actual.json'));
            assert.equal(trim(actualMessages), trim(expectedMessages));
        });
    });
});

describe('options', () => {
    it('enforces descriptions when enforceDescriptions=true', () => {
        const fixtureDir = path.join(fixturesDir, 'enforceDescriptions');

        try {
            transform(path.join(fixtureDir, 'actual.js'));
            assert(false);
        } catch (e) {
            assert(e);
            assert(/Message must have a `description`/.test(e.message));
        }
    });

    it('allows no description when enforceDescription=false', () => {
        const fixtureDir = path.join(fixturesDir, 'enforceDescriptions');

        try {
            transform(path.join(fixtureDir, 'actual.js'), {enforceDescriptions: false});
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('respects moduleSourceName', () => {
        const fixtureDir = path.join(fixturesDir, 'moduleSourceName');

        try {
            transform(path.join(fixtureDir, 'actual.js'), {moduleSourceName: 'react-i18n'});
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});

describe('errors', () => {
    it('Properly throws parse errors', () => {
        const fixtureDir = path.join(fixturesDir, 'icuSyntax');

        try {
            transform(path.join(fixtureDir, 'actual.js'));
            assert(false);
        } catch (e) {
            assert(e);
            assert(/Message failed to parse/.test(e.message));
            assert(/Expected .* but "\." found/.test(e.message));
        }
    });

});


const BASE_OPTIONS = {messagesDir: baseDir, enforceDescriptions: true};
function transform(filePath, options = {}) {
    return babel.transformFileSync(
        filePath, {
            babelrc: false,
            presets: [
                'es2015',
                'react',
            ],
            plugins: [
                [plugin, {...BASE_OPTIONS, ...options}],
            ],
        }
    ).code;
}
