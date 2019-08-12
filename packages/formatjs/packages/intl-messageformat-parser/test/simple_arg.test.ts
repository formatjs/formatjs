import {parse} from '../src/parser';

test('number arg', () => {
  expect(parse('I have {numCats, number} cats.')).toMatchSnapshot();
});

test('number arg with style', () => {
  expect(
    parse('Almost {pctBlack, number, percent} of them are black.')
  ).toMatchSnapshot();
});

test('date & time arg', () => {
  expect(
    parse(
      'Your meeting is scheduled for the {dateVal, date} at {timeVal, time}'
    )
  ).toMatchSnapshot();
});

test('date & time arg with style', () => {
  expect(
    parse(
      'Your meeting is scheduled for the {dateVal, date, long} at {timeVal, time, short}'
    )
  ).toMatchSnapshot();
});
