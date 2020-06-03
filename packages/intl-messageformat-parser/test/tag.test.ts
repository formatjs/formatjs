import {pegParse} from '../src/parser';

test('tag with number arg', () => {
  expect(
    pegParse('I have <foo>{numCats, number}</foo> cats.')
  ).toMatchSnapshot();
});

test('tag with number arg with noTagSupport', () => {
  expect(
    pegParse('I have <foo>{numCats, number}</foo> cats.', {noTagSupport: true})
  ).toMatchSnapshot();
});

test('tag with rich arg', () => {
  expect(
    pegParse(
      'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.'
    )
  ).toMatchSnapshot();
});

test('tag with rich arg with noTagSupport', () => {
  expect(
    pegParse(
      'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.',
      {noTagSupport: true}
    )
  ).toMatchSnapshot();
});

test('escaped tag with rich arg', () => {
  expect(pegParse("I '<3 cats.")).toMatchSnapshot();
});

test('escaped multiple tags', () => {
  expect(pegParse("I '<'3 cats. '<a>foo</a>' '<b>bar</b>'")).toMatchSnapshot();
});

test('escaped multiple tags with placeholder', () => {
  expect(
    pegParse("I '<'3 cats. '<a>foo</a>' '<b>'{bar}'</b>'")
  ).toMatchSnapshot();
});

test('mismatched tag', function () {
  expect(() => pegParse('this is <a>mismatch</b>')).toThrowError(/Mismatch/);
});

test('mismatched tag with noTagSupport', function () {
  expect(
    pegParse('this is <a>mismatch</b>', {noTagSupport: true})
  ).toMatchSnapshot();
});

test('nested tag', function () {
  expect(
    pegParse('this is <a>nested <b>{placeholder}</b></a>')
  ).toMatchSnapshot();
});

test('nested tag with noTagSupport', function () {
  expect(
    pegParse('this is <a>nested <b>{placeholder}</b></a>', {noTagSupport: true})
  ).toMatchSnapshot();
});

test('tag in plural', function () {
  expect(
    pegParse(
      'You have {count, plural, =1 {<b>1</b> Message} other {<b>#</b> Messages}}'
    )
  ).toMatchSnapshot();
});

test('tag in plural with noTagSupport', function () {
  expect(
    pegParse(
      'You have {count, plural, =1 {<b>1</b> Message} other {<b>#</b> Messages}}',
      {noTagSupport: true}
    )
  ).toMatchSnapshot();
});

test('self-closing tag', function () {
  expect(
    pegParse('this is <br/> <a>nested <b>{placeholder}</b></a>')
  ).toMatchSnapshot();
});

test('self-closing tag with noTagSupport', function () {
  expect(
    pegParse('this is <br/> <a>nested <b>{placeholder}</b></a>', {
      noTagSupport: true,
    })
  ).toMatchSnapshot();
});

test('tag with dash', function () {
  expect(
    pegParse('this is <br/> <dash-tag>nested <b>{placeholder}</b></dash-tag>')
  ).toMatchSnapshot();
});

test('tag with dash with noTagSupport', function () {
  expect(
    pegParse('this is <br/> <dash-tag>nested <b>{placeholder}</b></dash-tag>', {
      noTagSupport: true,
    })
  ).toMatchSnapshot();
});
