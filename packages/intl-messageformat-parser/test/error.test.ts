import {pegParse} from '../src';
describe('error', function() {
  [
    'You have {count, plural, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.',
    'You have {count, select, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.',
  ].forEach(mess => {
    it(`show throw SyntaxError '${mess}'`, function() {
      expect(() => pegParse(mess)).toThrowError(/Duplicate/);
    });
  });
});
