import {pegParse} from '../src/parser';

test('tag with number arg', () => {
  expect(
    pegParse('I have <foo>{numCats, number}</foo> cats.')
  ).toMatchSnapshot();
});

test('tag with rich arg', () => {
  expect(
    pegParse(
      'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.'
    )
  ).toMatchSnapshot();
});

test('escaped tag with rich arg', () => {
  expect(pegParse("I '<3 cats.")).toMatchSnapshot();
});

test('mismatched tag', function() {
  expect(() => pegParse('this is <a>mismatch</b>')).toThrowError(/Mismatch/);
});

test('nested tag', function () {
    expect(pegParse('this is <a>nested <b>{placeholder}</b></a>')).toMatchSnapshot()
})