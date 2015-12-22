import expect from 'expect';
import * as utils from '../../src/utils';

describe('utils', () => {
    describe('prepareIntlStyleOption()', () => {
        it('should remove style prop, which decorates DOM-elements', () => {
            const props = {a: 1, style: {}};
            expect(utils.prepareIntlStyleOption(props)['a']).toBe(1);
            expect(utils.prepareIntlStyleOption(props)['style']).toNotExist();
        });

        it('should rename intlStyle prop to style', () => {
            const props = {a: 1, intlStyle: {b: 2}};
            expect(utils.prepareIntlStyleOption(props)['a']).toBe(1);
            expect(utils.prepareIntlStyleOption(props)['intlStyle']).toNotExist();
            expect(utils.prepareIntlStyleOption(props)['style']['b']).toBe(2);
        });

        it('should replace style by intlStyle prop', () => {
            const props = {a: 1, style: {c: 3}, intlStyle: {b: 2}};
            expect(utils.prepareIntlStyleOption(props)['a']).toBe(1);
            expect(utils.prepareIntlStyleOption(props)['intlStyle']).toNotExist();
            expect(utils.prepareIntlStyleOption(props)['style']['b']).toBe(2);
            expect(utils.prepareIntlStyleOption(props)['style']['c']).toNotExist();
        });
    });
});