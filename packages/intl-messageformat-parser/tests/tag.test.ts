import {pegParse as _pegParse, IParseOptions} from '../src/parser';

// Make it easier to figure out the error location
function pegParse(
  source: string,
  options?: IParseOptions
): ReturnType<typeof _pegParse> {
  try {
    return _pegParse(source, options);
  } catch (err) {
    if (err.location) {
      const {start, end} = err.location;
      err.message = `(${start.line}:${start.column} - ${end.line}:${end.column}) ${err.message}`;
    }
    throw err;
  }
}

test('tag with number arg', () => {
  expect(
    pegParse('I have <foo>{numCats, number}</foo> cats.')
  ).toMatchSnapshot();
});

test('tag with number arg with ignoreTag', () => {
  expect(
    pegParse('I have <foo>{numCats, number}</foo> cats.', {ignoreTag: true})
  ).toMatchSnapshot();
});

test('tag with rich arg', () => {
  expect(
    pegParse(
      'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.'
    )
  ).toMatchSnapshot();
});

test('tag with rich arg with ignoreTag', () => {
  expect(
    pegParse(
      'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.',
      {ignoreTag: true}
    )
  ).toMatchSnapshot();
});

test('escaped tag with rich arg', () => {
  expect(pegParse("I '<3 cats.")).toMatchSnapshot();
});

test('unescaped left angle bracket', () => {
  expect(pegParse('I <3 cats.')).toMatchSnapshot();
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

test('mismatched tag with ignoreTag', function () {
  expect(
    pegParse('this is <a>mismatch</b>', {ignoreTag: true})
  ).toMatchSnapshot();
});

test('nested tag', function () {
  expect(
    pegParse('this is <a>nested <b>{placeholder}</b></a>')
  ).toMatchSnapshot();
});

test('nested tag with ignoreTag', function () {
  expect(
    pegParse('this is <a>nested <b>{placeholder}</b></a>', {ignoreTag: true})
  ).toMatchSnapshot();
});

test('tag in plural', function () {
  expect(
    pegParse(
      'You have {count, plural, =1 {<b>1</b> Message} other {<b>#</b> Messages}}'
    )
  ).toMatchSnapshot();
});

test('tag in plural with ignoreTag', function () {
  expect(
    pegParse(
      'You have {count, plural, =1 {<b>1</b> Message} other {<b>#</b> Messages}}',
      {ignoreTag: true}
    )
  ).toMatchSnapshot();
});

test('self-closing tag', function () {
  expect(
    pegParse('this is <br/> <a>nested <b>{placeholder}</b></a>')
  ).toMatchSnapshot();
});

test('self-closing tag with ignoreTag', function () {
  expect(
    pegParse('this is <br/> <a>nested <b>{placeholder}</b></a>', {
      ignoreTag: true,
    })
  ).toMatchSnapshot();
});

test('tag with dash', function () {
  expect(
    pegParse('this is <br/> <dash-tag>nested <b>{placeholder}</b></dash-tag>')
  ).toMatchSnapshot();
});

test('tag with dash with ignoreTag', function () {
  expect(
    pegParse('this is <br/> <dash-tag>nested <b>{placeholder}</b></dash-tag>', {
      ignoreTag: true,
    })
  ).toMatchSnapshot();
});

// https://github.com/formatjs/formatjs/issues/1845
test('issue #1845: less than sign without escape', () => {
  expect(
    pegParse('< {level, select, A {1} 4 {2} 3 {3} 2{6} 1{12}} hours')
  ).toMatchSnapshot();
});

// https://github.com/formatjs/formatjs/issues/1845
test('greater than sign without escape', () => {
  expect(
    pegParse('> {level, select, A {1} 4 {2} 3 {3} 2{6} 1{12}} hours')
  ).toMatchSnapshot();
});

test('unmatched closing tag', () => {
  expect(() => pegParse('a </foo>')).toThrow();
});

test('unclosed opening tag', () => {
  expect(() => pegParse('<foo>a')).toThrow();
});

test('unclosed opening tag with nested messages', () => {
  expect(() =>
    pegParse(`
    You have <em>{count, plural, =1 {</em> one message} other {<b>#</b> messages}}.
  `)
  ).toThrow();
});
