import {replacePlaceholders} from '../../src/placeholders';

describe('replacePlaceholders()', () => {
    it('should return an array with the string', () => {
        expect(replacePlaceholders('Some text')).toEqual(['Some text']);
    });

    it('should replace the static placeholder (can be an object)', () => {
        expect(replacePlaceholders('Some <x:a>awful</x:a> text', {
            a: {awe: 'some'},
        })).toEqual(['Some ', {awe: 'some'}, ' text']);
    });

    it('should replace the dynamic placeholder', () => {
        expect(replacePlaceholders('Some <x:a>awesome</x:a> text', {
            a: (text) => text,
        })).toEqual(['Some ', ['awesome'], ' text']);
    });

    it('should replace the placeholder with newline in the content', () => {
        expect(replacePlaceholders('Some <x:a>awesome\n</x:a> text', {
            a: (text) => text,
        })).toEqual(['Some ', ['awesome\n'], ' text']);
    });

    it('should replace nested placeholders', () => {
        expect(replacePlaceholders('Some <x:a> <x:b>inner</x:b> </x:a> text', {
            a: (children) => children,
            b: (children) => children,
        })).toEqual(['Some ', [' ', ['inner'], ' '], ' text']);
    });

    it('should replace multiple placeholders', () => {
        expect(replacePlaceholders('<x:a>one</x:a> <x:b>two</x:b>', {
            a: (children) => children,
            b: (children) => children,
        })).toEqual([['one'], ' ', ['two']]);
    });

    it('should replace multiple placeholders with the same name', () => {
        expect(replacePlaceholders('<x:a>one</x:a> <x:a>two</x:a>', {
            a: (children) => children,
        })).toEqual([['one'], ' ', ['two']]);
    });

    it('replace missing placeholder with null', () => {
        expect(replacePlaceholders('<x:a>one</x:a>')).toEqual([null]);
    });
});
