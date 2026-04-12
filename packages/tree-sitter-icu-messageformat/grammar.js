/**
 * Tree-sitter grammar for ICU MessageFormat v1
 *
 * Supports standard ICU MessageFormat v1 syntax plus formatjs extensions:
 * - Simple XML-like tags: <tag>children</tag>
 * - Self-closing tags: <tag /> or <tag/>
 *
 * @see https://unicode-org.github.io/icu/userguide/format_parse/messages/
 * @see https://formatjs.github.io/docs/core-concepts/icu-syntax
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Tag name character class matching formatjs _isPotentialElementNameChar
const TAG_NAME_CHAR =
  /[a-zA-Z0-9\-._\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

// Whitespace matching formatjs _isWhiteSpace:
// \t-\r (0009-000D), space (0020), NEL (0085), LRM/RLM (200E-200F),
// Line Sep (2028), Para Sep (2029)
const WS = /[\t-\r \u0085\u200e\u200f\u2028\u2029]+/

module.exports = grammar({
  name: 'icu_messageformat',

  // Whitespace is significant in literal text, so we do NOT auto-skip it.
  extras: _ => [],

  rules: {
    // A message is a sequence of elements
    message: $ => repeat($._element),

    _element: $ =>
      choice(
        $.literal,
        $.pound,
        $.argument,
        $.number_element,
        $.date_element,
        $.time_element,
        $.select_element,
        $.plural_element,
        $.selectordinal_element,
        $.tag,
        $.self_closing_tag,
        // Fallback: stray characters that don't start valid syntax
        prec(-5, alias('<', $.literal)), // < not starting a tag (e.g., "I <3 cats")
        prec(-5, alias('>', $.literal)), // lone >
        prec(-5, alias('}', $.literal)) // } at top level
      ),

    // ---------------------------------------------------------------
    // Literal text
    // ---------------------------------------------------------------
    // Matches runs of text that are not ICU syntax characters.
    // Special characters: { } < > # '
    //   '' → escaped single quote (literal ')
    //   'quoted text' → literal text (may contain { } < > #)
    //   'unclosed quote → literal text to end
    //   Lone ' → literal '
    //
    // Note: > is allowed in literal text.
    // Note: # is parsed as `pound` everywhere for structural matching.
    literal: _ =>
      token(
        prec(
          -1,
          repeat1(
            choice(
              /[^{}#<>']/, // any non-special char (includes whitespace, excludes { } # < > ')
              /'[{}#<>]/, // quoted special char — ' before { } # < > quotes that single char (ICU quoting)
              /'[^'{}]+/, // unclosed quote — stops at ' { or } to avoid consuming structural delimiters
              /'/ // lone apostrophe
            )
          )
        )
      ),

    // # sign — always parsed as its own node.
    pound: _ => '#',

    // ---------------------------------------------------------------
    // Tags (formatjs extension)
    // ---------------------------------------------------------------
    tag: $ => seq($.open_tag, repeat($._element), $.close_tag),

    open_tag: $ => seq('<', $.tag_name, '>'),
    close_tag: $ => seq('</', $.tag_name, '>'),

    self_closing_tag: $ => seq('<', $.tag_name, optional(WS), '/>'),

    tag_name: _ => token(seq(/[a-zA-Z]/, repeat(TAG_NAME_CHAR))),

    // ---------------------------------------------------------------
    // Simple argument: {identifier}
    // ---------------------------------------------------------------
    argument: $ => seq('{', optional(WS), $.identifier, optional(WS), '}'),

    // ---------------------------------------------------------------
    // Number: {identifier, number[, style]}
    // ---------------------------------------------------------------
    number_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'number',
        optional(seq(optional(WS), ',', optional(WS), $.number_style)),
        optional(WS),
        '}'
      ),

    number_style: $ => choice($.number_skeleton, $.style_text),

    number_skeleton: _ => token(seq('::', /[^}]+/)),

    // ---------------------------------------------------------------
    // Date: {identifier, date[, style]}
    // ---------------------------------------------------------------
    date_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'date',
        optional(seq(optional(WS), ',', optional(WS), $.date_time_style)),
        optional(WS),
        '}'
      ),

    // ---------------------------------------------------------------
    // Time: {identifier, time[, style]}
    // ---------------------------------------------------------------
    time_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'time',
        optional(seq(optional(WS), ',', optional(WS), $.date_time_style)),
        optional(WS),
        '}'
      ),

    date_time_style: $ => choice($.date_time_skeleton, $.style_text),

    date_time_skeleton: _ => token(seq('::', /[^}]+/)),

    // Generic style text (anything up to closing })
    style_text: _ => token(prec(-2, /[^}]+/)),

    // ---------------------------------------------------------------
    // Select: {identifier, select, key {msg} key {msg} ...}
    // ---------------------------------------------------------------
    select_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'select',
        optional(WS),
        ',',
        optional(WS),
        repeat1($.select_option),
        '}'
      ),

    select_option: $ =>
      seq(
        $.select_key,
        optional(WS),
        '{',
        repeat($._element),
        '}',
        optional(WS)
      ),

    // Select keys can be any identifier (including digit-starting like "4", "2")
    select_key: _ => /[^\s\u0085\u200e\u200f\u2028\u2029{}]+/,

    // ---------------------------------------------------------------
    // Plural: {identifier, plural, [offset:N] key {msg} ...}
    // ---------------------------------------------------------------
    plural_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'plural',
        optional(WS),
        ',',
        optional(WS),
        optional($.offset),
        repeat1($.plural_option),
        '}'
      ),

    // ---------------------------------------------------------------
    // SelectOrdinal: {identifier, selectordinal, [offset:N] key {msg} ...}
    // ---------------------------------------------------------------
    selectordinal_element: $ =>
      seq(
        '{',
        optional(WS),
        $.identifier,
        optional(WS),
        ',',
        optional(WS),
        'selectordinal',
        optional(WS),
        ',',
        optional(WS),
        optional($.offset),
        repeat1($.plural_option),
        '}'
      ),

    offset: $ =>
      seq('offset', optional(WS), ':', optional(WS), $.number, optional(WS)),

    plural_option: $ =>
      seq(
        $.plural_key,
        optional(WS),
        '{',
        repeat($._element),
        '}',
        optional(WS)
      ),

    plural_key: _ =>
      token(choice('zero', 'one', 'two', 'few', 'many', 'other', /=-?[0-9]+/)),

    // ---------------------------------------------------------------
    // Shared tokens
    // ---------------------------------------------------------------
    number: _ => /-?[0-9]+/,

    // Identifier: variable names used in arguments.
    // Matches any non-empty sequence excluding whitespace and
    // ICU/formatjs pattern syntax characters.
    // prettier-ignore
    identifier: _ => new RegExp("[^\\s\\u0085\\u200e\\u200f\\u2028\\u2029{}#<>,=!@%|\\\\/'\"\\];:.*^&()\\[]+"),
  },
})
