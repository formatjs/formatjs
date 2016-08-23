import expect from 'expect';
import {defineMessages, message} from '../../src/define-messages';

describe('Message Definition', () => {
    describe('exports', () => {
        it('exports `defineMessages`', () => {
            expect(defineMessages).toBeA('function');
        });

        it('exports `message`', () => {
            expect(message).toBeA('function');
        });
    });

    describe('defineMessages()', () => {
        it('returns the passed-in Message Descriptors', () => {
            const descriptors = {
                foo: {
                    id: 'foo',
                    description: 'For translator',
                    defaultMessage: 'Hello, World!',
                },
            };

            expect(defineMessages(descriptors)).toBe(descriptors);
        });
    });

    describe('message()', () => {
        it('returns a Message Descriptor', () => {
            const descriptor = message`foo bar`;
            expect(descriptor.defaultMessage).toBe('foo bar');
            expect(descriptor.id).toBe(descriptor.defaultMessage);
        });
    });
});
