import test, {ExecutionContext, Macro} from 'ava';
import dedent from 'dedent-js';
import {Parser, ParserOptions} from './parser';
import {NumberSkeletonToken} from './types';

// Parser snapshot test macro
function snapshot(t: ExecutionContext, message: string, options: ParserOptions) {
    t.snapshot(new Parser(message, options).parse());
}

// Number skeleton test macro
const numberSkeleton: Macro<[string, NumberSkeletonToken[]]> = (t, skeleton, expected) => {
    const parsed = new Parser(`{0, number, ::${skeleton}}`, {}).parse();
    t.deepEqual((parsed as any)?.val?.[0]?.style?.tokens, expected);
};
numberSkeleton.title = (providedTitle, skeleton, expected) => skeleton;

test('trivial_1', snapshot, 'a', {});

test('trivial_2', snapshot, '中文', {});

test('basic_argument_1', snapshot, '{a}', {});

test('basic_argument_2', snapshot, 'a {b} \nc', {});

test('unescaped_string_literal_1', snapshot, '}', {});

test('double_apostrophes_1', snapshot, "a''b", {});

test('quoted_string_1', snapshot, "'{a''b}'", {});

test('quoted_string_2', snapshot, "'}a''b{'", {});

test('quoted_string_3', snapshot, "aaa'{'", {});

test('quoted_string_4', snapshot, "aaa'}'", {});

test('not_quoted_string_1', snapshot, "'aa''b'", {});

test('not_quoted_string_2', snapshot, "I don't know", {});

// Substring starting at th apostrophe are all escaped because the quote did not close
test('unclosed_quoted_string_1', snapshot, "a '{a{ {}{}{} ''bb", {});

// The apostrophe here does not start a quote because it is not followed by `{` or `}`,
// so the `{}` is invalid syntax.
test('unclosed_quoted_string_2', snapshot, "a 'a {}{}", {});

// The last apostrophe ends the escaping, therefore the last `{}` is invalid syntax.
test('unclosed_quoted_string_3', snapshot, "a '{a{ {}{}{}}}''' \n {}", {});

test('unclosed_quoted_string_4', snapshot, "You have '{count'", {});

test('unclosed_quoted_string_5', snapshot, "You have '{count", {});

test('unclosed_quoted_string_6', snapshot, "You have '{count}", {});

// `#` are escaped in the plural argument.
test(
    'quoted_pound_sign_1',
    snapshot,
    "You {count, plural, one {worked for '#' hour} other {worked for '#' hours}} today.",
    {},
);

test(
    'quoted_pound_sign_2',
    snapshot,
    "You {count, plural, one {worked for '# hour} other {worked for '# hours}} today.",
    {},
);

test('simple_argument_1', snapshot, 'My name is {0}', {});

test('simple_argument_2', snapshot, 'My name is { name }', {});

test('empty_argument_1', snapshot, 'My name is { }', {});

test('empty_argument_2', snapshot, 'My name is {\n}', {});

test('malformed_argument_1', snapshot, 'My name is {0!}', {});

test('unclosed_argument_1', snapshot, 'My name is { 0', {});

test('unclosed_argument_2', snapshot, 'My name is { ', {});

test('simple_number_arg_1', snapshot, 'I have {numCats, number} cats.', {});

test(
    'simple_date_and_time_arg_1',
    snapshot,
    'Your meeting is scheduled for the {dateVal, date} at {timeVal, time}',
    {},
);

test('invalid_arg_format_1', snapshot, 'My name is {0, foo}', {});

test('expect_arg_format_1', snapshot, 'My name is {0, }', {});

test('unclosed_number_arg_1', snapshot, '{0, number', {});

test('unclosed_number_arg_2', snapshot, '{0, number, percent', {});

test('unclosed_number_arg_3', snapshot, '{0, number, ::percent', {});

test('number_arg_style_1', snapshot, '{0, number, percent}', {});

test('expect_number_arg_style_1', snapshot, '{0, number, }', {});

test('number_arg_skeleton_2', snapshot, '{0, number, :: currency/GBP}', {});

test('number_arg_skeleton_3', snapshot, '{0, number, ::currency/GBP compact-short}', {});

test('expect_number_arg_skeleton_token_1', snapshot, '{0, number, ::}', {});

test('expect_number_arg_skeleton_token_option_1', snapshot, '{0, number, ::currency/}', {});

// Skeleton tests
test(numberSkeleton, 'compact-short currency/GBP', [
    {stem: 'compact-short', options: []},
    {stem: 'currency', options: ['GBP']},
]);
test(numberSkeleton, '@@#', [{stem: '@@#', options: []}]);
test(numberSkeleton, 'currency/CAD unit-width-narrow', [
    {stem: 'currency', options: ['CAD']},
    {stem: 'unit-width-narrow', options: []},
]);
test(numberSkeleton, 'percent .##', [
    {stem: 'percent', options: []},
    {stem: '.##', options: []},
]);
// Some percent skeletons
test(numberSkeleton, 'percent .000*', [
    {stem: 'percent', options: []},
    {stem: '.000*', options: []},
]);
test(numberSkeleton, 'percent .0###', [
    {stem: 'percent', options: []},
    {stem: '.0###', options: []},
]);
test(numberSkeleton, 'percent .00/@##', [
    {stem: 'percent', options: []},
    {stem: '.00', options: ['@##']},
]);
test(numberSkeleton, 'percent .00/@@@', [
    {stem: 'percent', options: []},
    {stem: '.00', options: ['@@@']},
]);
test(numberSkeleton, 'percent .00/@@@@*', [
    {stem: 'percent', options: []},
    {stem: '.00', options: ['@@@@*']},
]);
// Complex currency skeleton
test(numberSkeleton, 'currency/GBP .00##/@@@ unit-width-full-name', [
    {stem: 'currency', options: ['GBP']},
    {stem: '.00##', options: ['@@@']},
    {stem: 'unit-width-full-name', options: []},
]);
// Complex unit
test(numberSkeleton, 'measure-unit/length-meter .00##/@@@ unit-width-full-name', [
    {stem: 'measure-unit', options: ['length-meter']},
    {stem: '.00##', options: ['@@@']},
    {stem: 'unit-width-full-name', options: []},
]);
// Multiple options
test(numberSkeleton, 'scientific/+ee/sign-always', [
    {stem: 'scientific', options: ['+ee', 'sign-always']},
]);

test('date_arg_skeleton_1', snapshot, "{0, date, ::yyyy.MM.dd G 'at' HH:mm:ss vvvv}", {});

test('date_arg_skeleton_2', snapshot, "{0, date, ::EEE, MMM d, ''yy}", {});

test('date_arg_skeleton_3', snapshot, '{0, date, ::h:mm a}', {});

test(
    'duplicate_plural_selectors',
    snapshot,
    'You have {count, plural, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.',
    {},
);

test(
    'duplicate_select_selectors',
    snapshot,
    'You have {count, select, one {# hot dog} one {# hamburger} one {# sandwich} other {# snacks}} in your lunch bag.',
    {},
);

test(
    'treat_unicode_nbsp_as_whitespace',
    snapshot,
    dedent`
    {gender, select,
    \u00a0male {
        {He}}
    \u00a0female {
        {She}}
    \u00a0other{
        {They}}}
    `,
    {},
);

test(
    'plural_arg_1',
    snapshot,
    dedent`
    Cart: {itemCount} {itemCount, plural,
        one {item}
        other {items}
    }`,
    {},
);

test(
    'plural_arg_2',
    snapshot,
    dedent`
    You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
    }.`,
    {},
);

test(
    'plural_arg_with_offset_1',
    snapshot,
    dedent`
    You have {itemCount, plural, offset: 2
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
    }.`,
    {},
);

test(
    'plural_arg_with_escaped_nested_message',
    snapshot,
    dedent`
    {itemCount, plural,
        one {item'}'}
        other {items'}'}
    }`,
    {},
);

test(
    'select_arg_1',
    snapshot,
    dedent`
    {gender, select,
        male {He}
        female {She}
        other {They}
    } will respond shortly.`,
    {},
);

test(
    'select_arg_with_nested_arguments',
    snapshot,
    dedent`
    {taxableArea, select,
        yes {An additional {taxRate, number, percent} tax will be collected.}
        other {No taxes apply.}
    }
    `,
    {},
);

test('self_closing_tag_1', snapshot, '<test-tag />', {});

test('self_closing_tag_2', snapshot, '<test-tag/>', {});

test('not_self_closing_tag_1', snapshot, '< test-tag />', {});

test('invalid_tag_1', snapshot, '<test! />', {});

test('invalid_tag_2', snapshot, '<test / >', {});

test('invalid_tag_3', snapshot, '<test foo />', {});

test('open_close_tag_1', snapshot, '<test-tag></test-tag>', {});

test('open_close_tag_2', snapshot, '<test-tag>foo</test-tag>', {});

test('open_close_tag_3', snapshot, '<test-tag>foo {0} bar</test-tag>', {});

test('invalid_closing_tag_1', snapshot, '<test>a</123>', {});

test('invalid_closing_tag_2', snapshot, '<test>a</', {});

test(
    'open_close_tag_with_nested_arg',
    snapshot,
    dedent`<bold>You have {
        count, plural,
        one {<italic>#</italic> apple}
        other {<italic>#</italic> apples}
    }.</bold>`,
    {},
);

test(
    'open_close_tag_with_args',
    snapshot,
    'I <b>have</b> <foo>{numCats, number} some string {placeholder}</foo> cats.',
    {},
);

test('incomplete_nested_message_in_tag', snapshot, '<a>{a, plural, other {</a>}}', {});

test('ignore_tags_1', snapshot, '<test-tag></test-tag>', {ignoreTag: true});

test('unmatched_open_close_tag_1', snapshot, '<a></b>', {});

test('unmatched_open_close_tag_2', snapshot, '<a></ab>', {});

test('invalid_close_tag_1', snapshot, '<a></ b>', {});

test('quoted_tag_1', snapshot, "'<a>", {});

test('ignore_tag_number_arg_1', snapshot, 'I have <foo>{numCats, number}</foo> cats.', {
    ignoreTag: true,
});

test('left_angle_bracket_1', snapshot, 'I <3 cats.', {});

test('escaped_multiple_tags_1', snapshot, "I '<'3 cats. '<a>foo</a>' '<b>bar</b>'", {});

test('nested_tags_1', snapshot, 'this is <a>nested <b>{placeholder}</b></a>', {});

// See: https://github.com/formatjs/formatjs/issues/1845
test('less_than_sign_1', snapshot, '< {level, select, A {1} 4 {2} 3 {3} 2{6} 1{12}} hours', {});

test(
    'nested_1',
    snapshot,
    dedent`
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
    `,
    {},
);

test(
    'negative_offset_1',
    snapshot,
    `{c, plural, offset:-2 =-1 { {text} project} other { {text} projects}}`,
    {},
);

test('not_escaped_pound_1', snapshot, `'#'`, {});

test(
    'escaped_pound_1',
    snapshot,
    `{numPhotos, plural, =0{no photos} =1{one photo} other{'#' photos}}`,
    {},
);

/**
 * @see https://unicode-org.github.io/icu/userguide/format_parse/messages/#quotingescaping
 * @see https://github.com/formatjs/formatjs/issues/97
 */
test('quoted_string_5', snapshot, "This '{isn''t}' obvious", {});

test(
    'selectordinal_1',
    snapshot,
    `{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor`,
    {},
);

// TODO: port https://github.com/formatjs/formatjs/blob/main/packages/intl-messageformat-parser/tests/index.test.ts
