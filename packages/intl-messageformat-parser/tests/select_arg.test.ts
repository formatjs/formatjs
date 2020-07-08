import {pegParse} from '../src/parser';

test('trivial', () => {
  expect(
    pegParse(`\
      {gender, select,
          male {He}
          female {She}
          other {They}
      } will respond shortly.
    `)
  ).toMatchSnapshot();
});

test('nested arguments', () => {
  expect(
    pegParse(`\
      {taxableArea, select,
          yes {An additional {taxRate, number, percent} tax will be collected.}
          other {No taxes apply.}
      }
    `)
  ).toMatchSnapshot();
});
