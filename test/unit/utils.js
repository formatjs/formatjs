import {createError} from "../../src/utils";

describe('utils', () => {
    describe('createError', () => {
        it ('should add exception message', () => {
           const e = new TypeError("unit test");

           expect(createError('error message', e)).toEqual("[React Intl] error message\nTypeError: unit test");
           expect(createError('error message')).toEqual("[React Intl] error message");
        });
    });
});
