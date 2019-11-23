import {pegParse} from '../src/parser';

test('trivial', () => {
  expect(
    pegParse(`\
      Cart: {itemCount} {itemCount, plural,
        one {item}
        other {items}
      }`)
  ).toMatchSnapshot();
  expect(
    pegParse(`\
      You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
      }.`)
  );
});

test('escaped nested message', () => {
  expect(
    pegParse(`\
      {itemCount, plural,
        one {item'}'}
        other {items'}'}
      }`)
  ).toMatchSnapshot();
});
