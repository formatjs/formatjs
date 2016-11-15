import * as p from 'path';
import expect from 'expect';
import {sync as globSync} from 'glob';

describe('locale data', () => {
    it('has generated locale data modules with correct shape', () => {
        const localeDataFiles = globSync('./locale-data/*.js');

        expect(localeDataFiles.length).toBeGreaterThan(0);
        localeDataFiles.forEach((filename) => {
            const localeData = require(p.resolve(filename));

            expect(localeData).toBeAn('array');
            localeData.forEach((locale) => {
                expect(locale).toBeAn('object');
                expect(locale.locale).toExist();
            });
        });
    });
});
