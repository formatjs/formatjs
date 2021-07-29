import {Parser, ParserOptions} from '../parser'

function testParser(message: string, options: ParserOptions = {}) {
  expect(new Parser(message, options).parse()).toMatchSnapshot()
}

function testNumberSkeleton(skeleton: string) {
  return test(skeleton, () => {
    const parsed = new Parser(`{0, number, ::${skeleton}}`, {
      shouldParseSkeletons: true,
    }).parse()
    expect(parsed).toMatchSnapshot()
  })
}

test('trivial_1', () => testParser('a', {}))

test('trivial_2', () => testParser('中文', {}))

test('basic_argument_1', () => testParser('{a}', {}))

test('basic_argument_2', () => testParser('a {b} \nc', {}))

test('unescaped_string_literal_1', () => testParser('}', {}))

test('double_apostrophes_1', () => testParser("a''b", {}))

test('quoted_string_1', () => testParser("'{a''b}'", {}))

test('quoted_string_2', () => testParser("'}a''b{'", {}))

test('quoted_string_3', () => testParser("aaa'{'", {}))

test('quoted_string_4', () => testParser("aaa'}'", {}))

test('not_quoted_string_1', () => testParser("'aa''b'", {}))

test('not_quoted_string_2', () => testParser("I don't know", {}))

// Substring starting at th apostrophe are all escaped because the quote did not close
test('unclosed_quoted_string_1', () => testParser("a '{a{ {}{}{} ''bb", {}))

// The apostrophe here does not start a quote because it is not followed by `{` or `}`,
// so the `{}` is invalid syntax.
test('unclosed_quoted_string_2', () => testParser("a 'a {}{}", {}))

// The last apostrophe ends the escaping, therefore the last `{}` is invalid syntax.
test('unclosed_quoted_string_3', () =>
  testParser("a '{a{ {}{}{}}}''' \n {}", {}))

test('unclosed_quoted_string_4', () => testParser("You have '{count'", {}))

test('unclosed_quoted_string_5', () => testParser("You have '{count", {}))

test('unclosed_quoted_string_6', () => testParser("You have '{count}", {}))

// `#` are escaped in the plural argument.
test('quoted_pound_sign_1', () =>
  testParser(
    "You {count, plural, one {worked for '#' hour} other {worked for '#' hours}} today.",
    {}
  ))

test('quoted_pound_sign_2', () =>
  testParser(
    "You {count, plural, one {worked for '# hour} other {worked for '# hours}} today.",
    {}
  ))

test('simple_argument_1', () => testParser('My name is {0}', {}))

test('simple_argument_2', () => testParser('My name is { name }', {}))

test('empty_argument_1', () => testParser('My name is { }', {}))

test('empty_argument_2', () => testParser('My name is {\n}', {}))

test('malformed_argument_1', () => testParser('My name is {0!}', {}))

test('unclosed_argument_1', () => testParser('My name is { 0', {}))

test('unclosed_argument_2', () => testParser('My name is { ', {}))

test('simple_number_arg_1', () =>
  testParser('I have {numCats, number} cats.', {}))

test('simple_date_and_time_arg_1', () =>
  testParser(
    'Your meeting is scheduled for the {dateVal, date} at {timeVal, time}'
  ))

test('invalid_arg_format_1', () => testParser('My name is {0, foo}', {}))

test('expect_arg_format_1', () => testParser('My name is {0, }', {}))

test('unclosed_number_arg_1', () => testParser('{0, number', {}))

test('unclosed_number_arg_2', () => testParser('{0, number, percent', {}))

test('unclosed_number_arg_3', () => testParser('{0, number, ::percent', {}))

test('number_arg_style_1', () => testParser('{0, number, percent}', {}))

test('expect_number_arg_style_1', () => testParser('{0, number, }', {}))

test('number_arg_skeleton_2', () =>
  testParser('{0, number, :: currency/GBP}', {}))

test('number_arg_skeleton_3', () =>
  testParser('{0, number, ::currency/GBP compact-short}'))

test('expect_number_arg_skeleton_token_1', () =>
  testParser('{0, number, ::}', {}))

test('expect_number_arg_skeleton_token_option_1', () =>
  testParser('{0, number, ::currency/}'))

// Skeleton tests
testNumberSkeleton('compact-short currency/GBP')
testNumberSkeleton('@@#')
testNumberSkeleton('currency/CAD unit-width-narrow')
testNumberSkeleton('percent .##')
// Some percent skeletons
testNumberSkeleton('percent .000*')
testNumberSkeleton('percent .0###')
testNumberSkeleton('percent .00/@##')
testNumberSkeleton('percent .00/@@@')
testNumberSkeleton('percent .00/@@@@*')
// Complex currency skeleton
testNumberSkeleton('currency/GBP .00##/@@@ unit-width-full-name')
// Complex unit
testNumberSkeleton('measure-unit/length-meter .00##/@@@ unit-width-full-name')
// Multiple options
testNumberSkeleton('scientific/+ee/sign-always')

test('date_arg_skeleton_1', () =>
  testParser("{0, date, ::yyyy.MM.dd G 'at' HH:mm:ss vvvv}"))

test('date_arg_skeleton_2', () =>
  testParser("{0, date, ::EEE, MMM d, ''yy}", {}))

test('date_arg_skeleton_3', () => testParser('{0, date, ::h:mm a}', {}))

test('duplicate_plural_selectors', () =>
  testParser(
    'You have {count, plural, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.'
  ))

test('duplicate_select_selectors', () =>
  testParser(
    'You have {count, select, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.'
  ))

test('treat_unicode_nbsp_as_whitespace', () =>
  testParser(
    `
    {gender, select,
    \u200Emale {
        {He}}
    \u200Efemale {
        {She}}
    \u200Eother{
        {They}}}
    `
  ))

test('plural_arg_1', () =>
  testParser(
    `
    Cart: {itemCount} {itemCount, plural,
        one {item}
        other {items}
    }`
  ))

test('plural_arg_2', () =>
  testParser(
    `
    You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
    }.`
  ))

test('plural_arg_with_offset_1', () =>
  testParser(
    `You have {itemCount, plural, offset: 2
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
    }.`
  ))

test('plural_arg_with_escaped_nested_message', () =>
  testParser(
    `
    {itemCount, plural,
        one {item'}'}
        other {items'}'}
    }`
  ))

test('select_arg_1', () =>
  testParser(
    `
    {gender, select,
        male {He}
        female {She}
        other {They}
    } will respond shortly.`
  ))

test('select_arg_with_nested_arguments', () =>
  testParser(
    `
    {taxableArea, select,
        yes {An additional {taxRate, number, percent} tax will be collected.}
        other {No taxes apply.}
    }
    `
  ))

test('self_closing_tag_1', () => testParser('<test-tag />', {}))

test('self_closing_tag_2', () => testParser('<test-tag/>', {}))

test('not_self_closing_tag_1', () => testParser('< test-tag />', {}))

test('invalid_tag_1', () => testParser('<test! />', {}))

test('invalid_tag_2', () => testParser('<test / >', {}))

test('invalid_tag_3', () => testParser('<test foo />', {}))

test('open_close_tag_1', () => testParser('<test-tag></test-tag>', {}))

test('open_close_tag_2', () => testParser('<test-tag>foo</test-tag>', {}))

test('numeric_tag_1', () => testParser('<i0>foo</i0>', {}))

test('open_close_tag_3', () =>
  testParser('<test-tag>foo {0} bar</test-tag>', {}))

test('invalid_closing_tag_1', () => testParser('<test>a</123>', {}))

test('invalid_closing_tag_2', () => testParser('<test>a</', {}))

test('open_close_tag_with_nested_arg', () =>
  testParser(
    `<bold>You have {
        count, plural,
        one {<italic>#</italic> apple}
        other {<italic>#</italic> apples}
    }.</bold>`
  ))

test('open_close_tag_with_args', () =>
  testParser(
    'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.'
  ))

test('incomplete_nested_message_in_tag', () =>
  testParser('<a>{a, plural, other {</a>}}'))

test('ignore_tags_1', () =>
  testParser('<test-tag></test-tag>', {ignoreTag: true}))

test('unmatched_open_close_tag_1', () => testParser('<a></b>', {}))

test('unmatched_open_close_tag_2', () => testParser('<a></ab>', {}))

test('invalid_close_tag_1', () => testParser('<a></ b>', {}))

test('quoted_tag_1', () => testParser("'<a>", {}))

test('ignore_tag_number_arg_1', () =>
  testParser('I have <foo>{numCats, number}</foo> cats.', {
    ignoreTag: true,
  }))

test('left_angle_bracket_1', () => testParser('I <3 cats.', {}))

test('escaped_multiple_tags_1', () =>
  testParser("I '<'3 cats. '<a>foo</a>' '<b>bar</b>'"))

test('nested_tags_1', () =>
  testParser('this is <a>nested <b>{placeholder}</b></a>'))

test('uppercase_tag_1', () =>
  testParser('this is <a>nested <Button>{placeholder}</Button></a>'))

// See: https://github.com/formatjs/formatjs/issues/1845
test('less_than_sign_1', () =>
  testParser('< {level, select, A {1} 4 {2} 3 {3} 2{6} 1{12}} hours'))

test('nested_1', () =>
  testParser(
    `
    {gender_of_host, select,
      female {
        {num_guests, plural, offset:1
          =0 {{host} does not give a party.}
          =1 {{host} invites {guest} to her party.}
          =2 {{host} invites {guest} and one other person to her party.}
          other {{host} invites {guest} and # other people to her party.}}}
      male {
        {num_guests, plural, offset:1
          =0 {{host} does not give a party.}
          =1 {{host} invites {guest} to his party.}
          =2 {{host} invites {guest} and one other person to his party.}
          other {{host} invites {guest} and # other people to his party.}}}
      other {
        {num_guests, plural, offset:1
          =0 {{host} does not give a party.}
          =1 {{host} invites {guest} to their party.}
          =2 {{host} invites {guest} and one other person to their party.}
          other {{host} invites {guest} and # other people to their party.}}}}
    `
  ))

test('negative_offset_1', () =>
  testParser(
    `{c, plural, offset:-2 =-1 { {text} project} other { {text} projects}}`
  ))

test('not_escaped_pound_1', () => testParser(`'#'`, {}))

test('escaped_pound_1', () =>
  testParser(
    `{numPhotos, plural, =0{no photos} =1{one photo} other{'#' photos}}`
  ))

/**
 * @see https://unicode-org.github.io/icu/userguide/format_parse/messages/#quotingescaping
 * @see https://github.com/formatjs/formatjs/issues/97
 */
test('quoted_string_5', () => testParser("This '{isn''t}' obvious", {}))

test('selectordinal_1', () =>
  testParser(
    `{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor`
  ))
