import expect from 'expect';
import * as ReactIntl from '../../src/';

const umdDev  = '../../dist/react-intl.js';
const umdProd = '../../dist/react-intl.min.js';
const cjs     = '../../lib/index.js';
const es      = '../../lib/index.es.js';

describe('builds', () => {
    describe('UMD dev', () => {
        it('evaluates', () => {
            expect(require(umdDev)).toExist();
        });

        it('has all React Intl exports', () => {
            const ReactIntlUMD = require(umdDev);

            Object.keys(ReactIntl).forEach((name) => {
                expect(ReactIntlUMD[name]).toBeA(typeof ReactIntl[name]);
            });
        });
    });

    describe('UMD prod', () => {
        it('evaluates', () => {
            expect(require(umdProd)).toExist();
        });

        it('has all React Intl exports', () => {
            const ReactIntlUMD = require(umdProd);

            Object.keys(ReactIntl).forEach((name) => {
                expect(ReactIntlUMD[name]).toBeA(typeof ReactIntl[name]);
            });
        });
    });

    describe('CJS', () => {
        it('evaluates', () => {
            expect(require(cjs)).toExist();
        });

        it('has all React Intl exports', () => {
            const ReactIntlCJS = require(cjs);

            Object.keys(ReactIntl).forEach((name) => {
                expect(ReactIntlCJS[name]).toBeA(typeof ReactIntl[name]);
            });
        });
    });

    describe('ES', () => {
        it('evaluates', () => {
            expect(require(es)).toExist();
        });

        it('has all React Intl exports', () => {
            const ReactIntlES = require(es);

            Object.keys(ReactIntl).forEach((name) => {
                expect(ReactIntlES[name]).toBeA(typeof ReactIntl[name]);
            });
        });
    });
});
