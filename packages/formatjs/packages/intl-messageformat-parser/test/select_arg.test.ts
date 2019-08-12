import {parse} from '../src/parser';

test('trivial', () => {
  expect(
    parse(`\
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
    parse(`\
      {taxableArea, select,
          yes {An additional {taxRate, number, percent} tax will be collected.}
          other {No taxes apply.}
      }
    `)
  ).toMatchSnapshot();
});
