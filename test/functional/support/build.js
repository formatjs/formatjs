import expect from 'expect';
import * as ReactIntl from '../../../src/';

export default function (buildPath) {
    describe('build', () => {
        it('evaluates', () => {
            expect(require(buildPath)).toExist();
        });

        it('has all React Intl exports', () => {
            const ReactIntlBuild = require(buildPath);

            Object.keys(ReactIntl).forEach((name) => {
                expect(ReactIntlBuild[name]).toBeA(typeof ReactIntl[name]);
            });
        });
    });
}
