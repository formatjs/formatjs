import { parse } from '../src/parser';

test('trivial', () => {
  expect(
    parse(`\
      Cart: {itemCount} {itemCount, plural,
        one {item}
        other {items}
      }`)
  ).toMatchSnapshot();
  expect(
    parse(`\
      You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
      }.`)
  );
});

test('escaped nested message', () => {
  expect(
    parse(`\
      {itemCount, plural,
        one {item'}'}
        other {items'}'}
      }`)
  ).toMatchSnapshot();
});
