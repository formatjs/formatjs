import {ErrorKind, ParserError} from './error'
import {
  DateTimeSkeleton,
  LiteralElement,
  Location,
  MessageFormatElement,
  NumberSkeleton,
  PluralOrSelectOption,
  SKELETON_TYPE,
  TagElement,
  TYPE,
} from './types'
import {SPACE_SEPARATOR_REGEX} from './regex.generated'
import {
  NumberSkeletonToken,
  parseNumberSkeleton,
  parseNumberSkeletonFromString,
  parseDateTimeSkeleton,
} from '@formatjs/icu-skeleton-parser'
import {getBestPattern} from './date-time-pattern-generator'

const SPACE_SEPARATOR_START_REGEX = new RegExp(
  `^${SPACE_SEPARATOR_REGEX.source}*`
)
const SPACE_SEPARATOR_END_REGEX = new RegExp(
  `${SPACE_SEPARATOR_REGEX.source}*$`
)

export interface Position {
  /** Offset in terms of UTF-16 *code unit*. */
  offset: number
  line: number
  /** Column offset in terms of unicode *code point*. */
  column: number
}

export interface ParserOptions {
  /**
   * Whether to treat HTML/XML tags as string literal
   * instead of parsing them as tag token.
   * When this is false we only allow simple tags without
   * any attributes
   */
  ignoreTag?: boolean
  /**
   * Should `select`, `selectordinal`, and `plural` arguments always include
   * the `other` case clause.
   */
  requiresOtherClause?: boolean
  /**
   * Whether to parse number/datetime skeleton
   * into Intl.NumberFormatOptions and Intl.DateTimeFormatOptions, respectively.
   */
  shouldParseSkeletons?: boolean
  /**
   * Capture location info in AST
   * Default is false
   */
  captureLocation?: boolean

  locale?: Intl.Locale
}

export type Result<T, E> = {val: T; err: null} | {val: null; err: E}
type ArgType =
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'plural'
  | 'selectordinal'
  | ''

function createLocation(start: Position, end: Position): Location {
  return {start, end}
}

// #region Ponyfills
// Consolidate these variables up top for easier toggling during debugging
const hasNativeStartsWith = !!String.prototype.startsWith
const hasNativeFromCodePoint = !!String.fromCodePoint
const hasNativeFromEntries = !!(Object as any).fromEntries
const hasNativeCodePointAt = !!String.prototype.codePointAt
const hasTrimStart = !!(String.prototype as any).trimStart
const hasTrimEnd = !!(String.prototype as any).trimEnd
const hasNativeIsSafeInteger = !!Number.isSafeInteger

const isSafeInteger = hasNativeIsSafeInteger
  ? Number.isSafeInteger
  : (n: unknown): boolean => {
      return (
        typeof n === 'number' &&
        isFinite(n) &&
        Math.floor(n) === n &&
        Math.abs(n) <= 0x1fffffffffffff
      )
    }

// IE11 does not support y and u.
let REGEX_SUPPORTS_U_AND_Y = true
try {
  const re = RE('([^\\p{White_Space}\\p{Pattern_Syntax}]*)', 'yu')
  /**
   * legacy Edge or Xbox One browser
   * Unicode flag support: supported
   * Pattern_Syntax support: not supported
   * See https://github.com/formatjs/formatjs/issues/2822
   */
  REGEX_SUPPORTS_U_AND_Y = re.exec('a')?.[0] === 'a'
} catch (_) {
  REGEX_SUPPORTS_U_AND_Y = false
}

const startsWith: (s: string, search: string, position: number) => boolean =
  hasNativeStartsWith
    ? // Native
      function startsWith(s, search, position) {
        return s.startsWith(search, position)
      }
    : // For IE11
      function startsWith(s, search, position) {
        return s.slice(position, position + search.length) === search
      }

const fromCodePoint: typeof String.fromCodePoint = hasNativeFromCodePoint
  ? String.fromCodePoint
  : // IE11
    function fromCodePoint(...codePoints: number[]) {
      let elements = ''
      let length = codePoints.length
      let i = 0
      let code: number
      while (length > i) {
        code = codePoints[i++]
        if (code > 0x10ffff)
          throw RangeError(code + ' is not a valid code point')
        elements +=
          code < 0x10000
            ? String.fromCharCode(code)
            : String.fromCharCode(
                ((code -= 0x10000) >> 10) + 0xd800,
                (code % 0x400) + 0xdc00
              )
      }
      return elements
    }

const fromEntries: <T = any>(
  entries: readonly (readonly [string, T])[]
) => {[k: string]: T} =
  // native
  hasNativeFromEntries
    ? (Object as any).fromEntries
    : // Ponyfill
      function fromEntries(entries) {
        const obj: Record<string, any> = {}
        for (const [k, v] of entries) {
          obj[k] = v
        }
        return obj
      }

const codePointAt: (s: string, index: number) => number | undefined =
  hasNativeCodePointAt
    ? // Native
      function codePointAt(s, index) {
        return s.codePointAt(index)
      }
    : // IE 11
      function codePointAt(s, index) {
        let size = s.length
        if (index < 0 || index >= size) {
          return undefined
        }
        let first = s.charCodeAt(index)
        let second
        return first < 0xd800 ||
          first > 0xdbff ||
          index + 1 === size ||
          (second = s.charCodeAt(index + 1)) < 0xdc00 ||
          second > 0xdfff
          ? first
          : ((first - 0xd800) << 10) + (second - 0xdc00) + 0x10000
      }

const trimStart: (s: string) => string = hasTrimStart
  ? // Native
    function trimStart(s) {
      return (s as any).trimStart()
    }
  : // Ponyfill
    function trimStart(s) {
      return s.replace(SPACE_SEPARATOR_START_REGEX, '')
    }

const trimEnd: (s: string) => string = hasTrimEnd
  ? // Native
    function trimEnd(s) {
      return (s as any).trimEnd()
    }
  : // Ponyfill
    function trimEnd(s) {
      return s.replace(SPACE_SEPARATOR_END_REGEX, '')
    }

// Prevent minifier to translate new RegExp to literal form that might cause syntax error on IE11.
function RE(s: string, flag: string) {
  return new RegExp(s, flag)
}
// #endregion

let matchIdentifierAtIndex: (s: string, index: number) => string
if (REGEX_SUPPORTS_U_AND_Y) {
  // Native
  const IDENTIFIER_PREFIX_RE = RE(
    '([^\\p{White_Space}\\p{Pattern_Syntax}]*)',
    'yu'
  )
  matchIdentifierAtIndex = function matchIdentifierAtIndex(s, index) {
    IDENTIFIER_PREFIX_RE.lastIndex = index
    const match = IDENTIFIER_PREFIX_RE.exec(s)!
    return match[1] ?? ''
  }
} else {
  // IE11
  matchIdentifierAtIndex = function matchIdentifierAtIndex(s, index) {
    let match: number[] = []
    while (true) {
      const c = codePointAt(s, index)
      if (c === undefined || _isWhiteSpace(c) || _isPatternSyntax(c)) {
        break
      }
      match.push(c)
      index += c >= 0x10000 ? 2 : 1
    }
    return fromCodePoint(...match)
  }
}
export class Parser {
  private message: string
  private position: Position
  private locale?: Intl.Locale

  private ignoreTag: boolean
  private requiresOtherClause: boolean
  private shouldParseSkeletons?: boolean

  constructor(message: string, options: ParserOptions = {}) {
    this.message = message
    this.position = {offset: 0, line: 1, column: 1}
    this.ignoreTag = !!options.ignoreTag
    this.locale = options.locale
    this.requiresOtherClause = !!options.requiresOtherClause
    this.shouldParseSkeletons = !!options.shouldParseSkeletons
  }

  parse(): Result<MessageFormatElement[], ParserError> {
    if (this.offset() !== 0) {
      throw Error('parser can only be used once')
    }
    return this.parseMessage(0, '', false)
  }

  private parseMessage(
    nestingLevel: number,
    parentArgType: ArgType,
    expectingCloseTag: boolean
  ): Result<MessageFormatElement[], ParserError> {
    let elements: MessageFormatElement[] = []

    while (!this.isEOF()) {
      const char = this.char()
      if (char === 123 /* `{` */) {
        const result = this.parseArgument(nestingLevel, expectingCloseTag)
        if (result.err) {
          return result
        }
        elements.push(result.val)
      } else if (char === 125 /* `}` */ && nestingLevel > 0) {
        break
      } else if (
        char === 35 /* `#` */ &&
        (parentArgType === 'plural' || parentArgType === 'selectordinal')
      ) {
        const position = this.clonePosition()
        this.bump()
        elements.push({
          type: TYPE.pound,
          location: createLocation(position, this.clonePosition()),
        })
      } else if (
        char === 60 /* `<` */ &&
        !this.ignoreTag &&
        this.peek() === 47 // char code for '/'
      ) {
        if (expectingCloseTag) {
          break
        } else {
          return this.error(
            ErrorKind.UNMATCHED_CLOSING_TAG,
            createLocation(this.clonePosition(), this.clonePosition())
          )
        }
      } else if (
        char === 60 /* `<` */ &&
        !this.ignoreTag &&
        _isAlpha(this.peek() || 0)
      ) {
        const result = this.parseTag(nestingLevel, parentArgType)
        if (result.err) {
          return result
        }
        elements.push(result.val)
      } else {
        const result = this.parseLiteral(nestingLevel, parentArgType)
        if (result.err) {
          return result
        }
        elements.push(result.val)
      }
    }

    return {val: elements, err: null}
  }
  /**
   * A tag name must start with an ASCII lower/upper case letter. The grammar is based on the
   * [custom element name][] except that a dash is NOT always mandatory and uppercase letters
   * are accepted:
   *
   * ```
   * tag ::= "<" tagName (whitespace)* "/>" | "<" tagName (whitespace)* ">" message "</" tagName (whitespace)* ">"
   * tagName ::= [a-z] (PENChar)*
   * PENChar ::=
   *     "-" | "." | [0-9] | "_" | [a-z] | [A-Z] | #xB7 | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x37D] |
   *     [#x37F-#x1FFF] | [#x200C-#x200D] | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
   *     [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
   * ```
   *
   * [custom element name]: https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
   * NOTE: We're a bit more lax here since HTML technically does not allow uppercase HTML element but we do
   * since other tag-based engines like React allow it
   */
  private parseTag(
    nestingLevel: number,
    parentArgType: ArgType
  ): Result<TagElement | LiteralElement, ParserError> {
    const startPosition = this.clonePosition()
    this.bump() // `<`

    const tagName = this.parseTagName()
    this.bumpSpace()

    if (this.bumpIf('/>')) {
      // Self closing tag
      return {
        val: {
          type: TYPE.literal,
          value: `<${tagName}/>`,
          location: createLocation(startPosition, this.clonePosition()),
        } as LiteralElement,
        err: null,
      }
    } else if (this.bumpIf('>')) {
      const childrenResult = this.parseMessage(
        nestingLevel + 1,
        parentArgType,
        true
      )
      if (childrenResult.err) {
        return childrenResult
      }
      const children = childrenResult.val

      // Expecting a close tag
      const endTagStartPosition = this.clonePosition()

      if (this.bumpIf('</')) {
        if (this.isEOF() || !_isAlpha(this.char())) {
          return this.error(
            ErrorKind.INVALID_TAG,
            createLocation(endTagStartPosition, this.clonePosition())
          )
        }

        const closingTagNameStartPosition = this.clonePosition()
        const closingTagName = this.parseTagName()
        if (tagName !== closingTagName) {
          return this.error(
            ErrorKind.UNMATCHED_CLOSING_TAG,
            createLocation(closingTagNameStartPosition, this.clonePosition())
          )
        }

        this.bumpSpace()
        if (!this.bumpIf('>')) {
          return this.error(
            ErrorKind.INVALID_TAG,
            createLocation(endTagStartPosition, this.clonePosition())
          )
        }

        return {
          val: {
            type: TYPE.tag,
            value: tagName,
            children,
            location: createLocation(startPosition, this.clonePosition()),
          },
          err: null,
        }
      } else {
        return this.error(
          ErrorKind.UNCLOSED_TAG,
          createLocation(startPosition, this.clonePosition())
        )
      }
    } else {
      return this.error(
        ErrorKind.INVALID_TAG,
        createLocation(startPosition, this.clonePosition())
      )
    }
  }

  /**
   * This method assumes that the caller has peeked ahead for the first tag character.
   */
  private parseTagName(): string {
    const startOffset = this.offset()

    this.bump() // the first tag name character
    while (!this.isEOF() && _isPotentialElementNameChar(this.char())) {
      this.bump()
    }
    return this.message.slice(startOffset, this.offset())
  }

  private parseLiteral(
    nestingLevel: number,
    parentArgType: ArgType
  ): Result<LiteralElement, ParserError> {
    const start = this.clonePosition()

    let value = ''
    while (true) {
      const parseQuoteResult = this.tryParseQuote(parentArgType)
      if (parseQuoteResult) {
        value += parseQuoteResult
        continue
      }

      const parseUnquotedResult = this.tryParseUnquoted(
        nestingLevel,
        parentArgType
      )
      if (parseUnquotedResult) {
        value += parseUnquotedResult
        continue
      }

      const parseLeftAngleResult = this.tryParseLeftAngleBracket()
      if (parseLeftAngleResult) {
        value += parseLeftAngleResult
        continue
      }

      break
    }

    const location = createLocation(start, this.clonePosition())
    return {
      val: {type: TYPE.literal, value, location},
      err: null,
    }
  }

  tryParseLeftAngleBracket(): string | null {
    if (
      !this.isEOF() &&
      this.char() === 60 /* `<` */ &&
      (this.ignoreTag ||
        // If at the opening tag or closing tag position, bail.
        !_isAlphaOrSlash(this.peek() || 0))
    ) {
      this.bump() // `<`
      return '<'
    }
    return null
  }

  /**
   * Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
   * a character that requires quoting (that is, "only where needed"), and works the same in
   * nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
   */
  private tryParseQuote(parentArgType: ArgType): string | null {
    if (this.isEOF() || this.char() !== 39 /* `'` */) {
      return null
    }

    // Parse escaped char following the apostrophe, or early return if there is no escaped char.
    // Check if is valid escaped character
    switch (this.peek()) {
      case 39 /* `'` */:
        // double quote, should return as a single quote.
        this.bump()
        this.bump()
        return "'"
      // '{', '<', '>', '}'
      case 123:
      case 60:
      case 62:
      case 125:
        break
      case 35: // '#'
        if (parentArgType === 'plural' || parentArgType === 'selectordinal') {
          break
        }
        return null
      default:
        return null
    }

    this.bump() // apostrophe
    const codePoints = [this.char()] // escaped char
    this.bump()

    // read chars until the optional closing apostrophe is found
    while (!this.isEOF()) {
      const ch = this.char()
      if (ch === 39 /* `'` */) {
        if (this.peek() === 39 /* `'` */) {
          codePoints.push(39)
          // Bump one more time because we need to skip 2 characters.
          this.bump()
        } else {
          // Optional closing apostrophe.
          this.bump()
          break
        }
      } else {
        codePoints.push(ch)
      }
      this.bump()
    }

    return fromCodePoint(...codePoints)
  }

  private tryParseUnquoted(
    nestingLevel: number,
    parentArgType: ArgType
  ): string | null {
    if (this.isEOF()) {
      return null
    }
    const ch = this.char()

    if (
      ch === 60 /* `<` */ ||
      ch === 123 /* `{` */ ||
      (ch === 35 /* `#` */ &&
        (parentArgType === 'plural' || parentArgType === 'selectordinal')) ||
      (ch === 125 /* `}` */ && nestingLevel > 0)
    ) {
      return null
    } else {
      this.bump()
      return fromCodePoint(ch)
    }
  }

  private parseArgument(
    nestingLevel: number,
    expectingCloseTag: boolean
  ): Result<MessageFormatElement, ParserError> {
    const openingBracePosition = this.clonePosition()
    this.bump() // `{`

    this.bumpSpace()

    if (this.isEOF()) {
      return this.error(
        ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE,
        createLocation(openingBracePosition, this.clonePosition())
      )
    }

    if (this.char() === 125 /* `}` */) {
      this.bump()
      return this.error(
        ErrorKind.EMPTY_ARGUMENT,
        createLocation(openingBracePosition, this.clonePosition())
      )
    }

    // argument name
    let value = this.parseIdentifierIfPossible().value
    if (!value) {
      return this.error(
        ErrorKind.MALFORMED_ARGUMENT,
        createLocation(openingBracePosition, this.clonePosition())
      )
    }

    this.bumpSpace()

    if (this.isEOF()) {
      return this.error(
        ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE,
        createLocation(openingBracePosition, this.clonePosition())
      )
    }

    switch (this.char()) {
      // Simple argument: `{name}`
      case 125 /* `}` */: {
        this.bump() // `}`
        return {
          val: {
            type: TYPE.argument,
            // value does not include the opening and closing braces.
            value,
            location: createLocation(
              openingBracePosition,
              this.clonePosition()
            ),
          },
          err: null,
        }
      }
      // Argument with options: `{name, format, ...}`
      case 44 /* `,` */: {
        this.bump() // `,`
        this.bumpSpace()

        if (this.isEOF()) {
          return this.error(
            ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE,
            createLocation(openingBracePosition, this.clonePosition())
          )
        }

        return this.parseArgumentOptions(
          nestingLevel,
          expectingCloseTag,
          value,
          openingBracePosition
        )
      }
      default:
        return this.error(
          ErrorKind.MALFORMED_ARGUMENT,
          createLocation(openingBracePosition, this.clonePosition())
        )
    }
  }

  /**
   * Advance the parser until the end of the identifier, if it is currently on
   * an identifier character. Return an empty string otherwise.
   */
  private parseIdentifierIfPossible(): {value: string; location: Location} {
    const startingPosition = this.clonePosition()

    const startOffset = this.offset()
    const value = matchIdentifierAtIndex(this.message, startOffset)
    const endOffset = startOffset + value.length

    this.bumpTo(endOffset)

    const endPosition = this.clonePosition()
    const location = createLocation(startingPosition, endPosition)

    return {value, location}
  }

  private parseArgumentOptions(
    nestingLevel: number,
    expectingCloseTag: boolean,
    value: string,
    openingBracePosition: Position
  ): Result<MessageFormatElement, ParserError> {
    // Parse this range:
    // {name, type, style}
    //        ^---^
    let typeStartPosition = this.clonePosition()
    let argType = this.parseIdentifierIfPossible().value
    let typeEndPosition = this.clonePosition()

    switch (argType) {
      case '':
        // Expecting a style string number, date, time, plural, selectordinal, or select.
        return this.error(
          ErrorKind.EXPECT_ARGUMENT_TYPE,
          createLocation(typeStartPosition, typeEndPosition)
        )
      case 'number':
      case 'date':
      case 'time': {
        // Parse this range:
        // {name, number, style}
        //              ^-------^
        this.bumpSpace()
        let styleAndLocation: {
          style: string
          styleLocation: Location
        } | null = null

        if (this.bumpIf(',')) {
          this.bumpSpace()

          const styleStartPosition = this.clonePosition()
          const result = this.parseSimpleArgStyleIfPossible()
          if (result.err) {
            return result
          }
          const style = trimEnd(result.val)

          if (style.length === 0) {
            return this.error(
              ErrorKind.EXPECT_ARGUMENT_STYLE,
              createLocation(this.clonePosition(), this.clonePosition())
            )
          }

          const styleLocation = createLocation(
            styleStartPosition,
            this.clonePosition()
          )
          styleAndLocation = {style, styleLocation}
        }

        const argCloseResult = this.tryParseArgumentClose(openingBracePosition)
        if (argCloseResult.err) {
          return argCloseResult
        }

        const location = createLocation(
          openingBracePosition,
          this.clonePosition()
        )

        // Extract style or skeleton
        if (styleAndLocation && startsWith(styleAndLocation?.style, '::', 0)) {
          // Skeleton starts with `::`.
          let skeleton = trimStart(styleAndLocation.style.slice(2))

          if (argType === 'number') {
            const result = this.parseNumberSkeletonFromString(
              skeleton,
              styleAndLocation.styleLocation
            )
            if (result.err) {
              return result
            }
            return {
              val: {type: TYPE.number, value, location, style: result.val},
              err: null,
            }
          } else {
            if (skeleton.length === 0) {
              return this.error(ErrorKind.EXPECT_DATE_TIME_SKELETON, location)
            }

            let dateTimePattern = skeleton

            // Get "best match" pattern only if locale is passed, if not, let it
            // pass as-is where `parseDateTimeSkeleton()` will throw an error
            // for unsupported patterns.
            if (this.locale) {
              dateTimePattern = getBestPattern(skeleton, this.locale)
            }

            const style: DateTimeSkeleton = {
              type: SKELETON_TYPE.dateTime,
              pattern: dateTimePattern,
              location: styleAndLocation.styleLocation,
              parsedOptions: this.shouldParseSkeletons
                ? parseDateTimeSkeleton(dateTimePattern)
                : {},
            }

            const type = argType === 'date' ? TYPE.date : TYPE.time
            return {
              val: {type, value, location, style},
              err: null,
            }
          }
        }

        // Regular style or no style.
        return {
          val: {
            type:
              argType === 'number'
                ? TYPE.number
                : argType === 'date'
                ? TYPE.date
                : TYPE.time,
            value,
            location,
            style: styleAndLocation?.style ?? null,
          },
          err: null,
        }
      }
      case 'plural':
      case 'selectordinal':
      case 'select': {
        // Parse this range:
        // {name, plural, options}
        //              ^---------^
        const typeEndPosition = this.clonePosition()
        this.bumpSpace()

        if (!this.bumpIf(',')) {
          return this.error(
            ErrorKind.EXPECT_SELECT_ARGUMENT_OPTIONS,
            createLocation(typeEndPosition, {...typeEndPosition})
          )
        }
        this.bumpSpace()

        // Parse offset:
        // {name, plural, offset:1, options}
        //                ^-----^
        //
        // or the first option:
        //
        // {name, plural, one {...} other {...}}
        //                ^--^
        let identifierAndLocation = this.parseIdentifierIfPossible()

        let pluralOffset = 0
        if (argType !== 'select' && identifierAndLocation.value === 'offset') {
          if (!this.bumpIf(':')) {
            return this.error(
              ErrorKind.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
              createLocation(this.clonePosition(), this.clonePosition())
            )
          }
          this.bumpSpace()
          const result = this.tryParseDecimalInteger(
            ErrorKind.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
            ErrorKind.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE
          )
          if (result.err) {
            return result
          }

          // Parse another identifier for option parsing
          this.bumpSpace()
          identifierAndLocation = this.parseIdentifierIfPossible()

          pluralOffset = result.val
        }

        const optionsResult = this.tryParsePluralOrSelectOptions(
          nestingLevel,
          argType,
          expectingCloseTag,
          identifierAndLocation
        )
        if (optionsResult.err) {
          return optionsResult
        }

        const argCloseResult = this.tryParseArgumentClose(openingBracePosition)
        if (argCloseResult.err) {
          return argCloseResult
        }

        const location = createLocation(
          openingBracePosition,
          this.clonePosition()
        )

        if (argType === 'select') {
          return {
            val: {
              type: TYPE.select,
              value,
              options: fromEntries(optionsResult.val),
              location,
            },
            err: null,
          }
        } else {
          return {
            val: {
              type: TYPE.plural,
              value,
              options: fromEntries(optionsResult.val),
              offset: pluralOffset,
              pluralType: argType === 'plural' ? 'cardinal' : 'ordinal',
              location,
            },
            err: null,
          }
        }
      }
      default:
        return this.error(
          ErrorKind.INVALID_ARGUMENT_TYPE,
          createLocation(typeStartPosition, typeEndPosition)
        )
    }
  }

  private tryParseArgumentClose(
    openingBracePosition: Position
  ): Result<true, ParserError> {
    // Parse: {value, number, ::currency/GBP }
    //
    if (this.isEOF() || this.char() !== 125 /* `}` */) {
      return this.error(
        ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE,
        createLocation(openingBracePosition, this.clonePosition())
      )
    }
    this.bump() // `}`
    return {val: true, err: null}
  }

  /**
   * See: https://github.com/unicode-org/icu/blob/af7ed1f6d2298013dc303628438ec4abe1f16479/icu4c/source/common/messagepattern.cpp#L659
   */
  private parseSimpleArgStyleIfPossible(): Result<string, ParserError> {
    let nestedBraces = 0

    const startPosition = this.clonePosition()
    while (!this.isEOF()) {
      const ch = this.char()
      switch (ch) {
        case 39 /* `'` */: {
          // Treat apostrophe as quoting but include it in the style part.
          // Find the end of the quoted literal text.
          this.bump()
          let apostrophePosition = this.clonePosition()

          if (!this.bumpUntil("'")) {
            return this.error(
              ErrorKind.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,
              createLocation(apostrophePosition, this.clonePosition())
            )
          }
          this.bump()
          break
        }
        case 123 /* `{` */: {
          nestedBraces += 1
          this.bump()
          break
        }
        case 125 /* `}` */: {
          if (nestedBraces > 0) {
            nestedBraces -= 1
          } else {
            return {
              val: this.message.slice(startPosition.offset, this.offset()),
              err: null,
            }
          }
          break
        }
        default:
          this.bump()
          break
      }
    }
    return {
      val: this.message.slice(startPosition.offset, this.offset()),
      err: null,
    }
  }

  private parseNumberSkeletonFromString(
    skeleton: string,
    location: Location
  ): Result<NumberSkeleton, ParserError> {
    let tokens: NumberSkeletonToken[] = []
    try {
      tokens = parseNumberSkeletonFromString(skeleton)
    } catch (e) {
      return this.error(ErrorKind.INVALID_NUMBER_SKELETON, location)
    }

    return {
      val: {
        type: SKELETON_TYPE.number,
        tokens,
        location,
        parsedOptions: this.shouldParseSkeletons
          ? parseNumberSkeleton(tokens)
          : {},
      },
      err: null,
    }
  }

  /**
   * @param nesting_level The current nesting level of messages.
   *     This can be positive when parsing message fragment in select or plural argument options.
   * @param parent_arg_type The parent argument's type.
   * @param parsed_first_identifier If provided, this is the first identifier-like selector of
   *     the argument. It is a by-product of a previous parsing attempt.
   * @param expecting_close_tag If true, this message is directly or indirectly nested inside
   *     between a pair of opening and closing tags. The nested message will not parse beyond
   *     the closing tag boundary.
   */
  private tryParsePluralOrSelectOptions(
    nestingLevel: number,
    parentArgType: ArgType,
    expectCloseTag: boolean,
    parsedFirstIdentifier: {value: string; location: Location}
  ): Result<[string, PluralOrSelectOption][], ParserError> {
    let hasOtherClause = false
    const options: [string, PluralOrSelectOption][] = []
    const parsedSelectors = new Set<string>()
    let {value: selector, location: selectorLocation} = parsedFirstIdentifier

    // Parse:
    // one {one apple}
    // ^--^
    while (true) {
      if (selector.length === 0) {
        const startPosition = this.clonePosition()
        if (parentArgType !== 'select' && this.bumpIf('=')) {
          // Try parse `={number}` selector
          const result = this.tryParseDecimalInteger(
            ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR,
            ErrorKind.INVALID_PLURAL_ARGUMENT_SELECTOR
          )
          if (result.err) {
            return result
          }
          selectorLocation = createLocation(startPosition, this.clonePosition())
          selector = this.message.slice(startPosition.offset, this.offset())
        } else {
          break
        }
      }

      // Duplicate selector clauses
      if (parsedSelectors.has(selector)) {
        return this.error(
          parentArgType === 'select'
            ? ErrorKind.DUPLICATE_SELECT_ARGUMENT_SELECTOR
            : ErrorKind.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,
          selectorLocation
        )
      }

      if (selector === 'other') {
        hasOtherClause = true
      }

      // Parse:
      // one {one apple}
      //     ^----------^
      this.bumpSpace()
      const openingBracePosition = this.clonePosition()
      if (!this.bumpIf('{')) {
        return this.error(
          parentArgType === 'select'
            ? ErrorKind.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT
            : ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,
          createLocation(this.clonePosition(), this.clonePosition())
        )
      }

      const fragmentResult = this.parseMessage(
        nestingLevel + 1,
        parentArgType,
        expectCloseTag
      )
      if (fragmentResult.err) {
        return fragmentResult
      }
      const argCloseResult = this.tryParseArgumentClose(openingBracePosition)
      if (argCloseResult.err) {
        return argCloseResult
      }

      options.push([
        selector,
        {
          value: fragmentResult.val,
          location: createLocation(openingBracePosition, this.clonePosition()),
        },
      ])
      // Keep track of the existing selectors
      parsedSelectors.add(selector)

      // Prep next selector clause.
      this.bumpSpace()
      ;({value: selector, location: selectorLocation} =
        this.parseIdentifierIfPossible())
    }

    if (options.length === 0) {
      return this.error(
        parentArgType === 'select'
          ? ErrorKind.EXPECT_SELECT_ARGUMENT_SELECTOR
          : ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR,
        createLocation(this.clonePosition(), this.clonePosition())
      )
    }

    if (this.requiresOtherClause && !hasOtherClause) {
      return this.error(
        ErrorKind.MISSING_OTHER_CLAUSE,
        createLocation(this.clonePosition(), this.clonePosition())
      )
    }

    return {val: options, err: null}
  }

  private tryParseDecimalInteger(
    expectNumberError: ErrorKind,
    invalidNumberError: ErrorKind
  ): Result<number, ParserError> {
    let sign = 1
    const startingPosition = this.clonePosition()

    if (this.bumpIf('+')) {
    } else if (this.bumpIf('-')) {
      sign = -1
    }

    let hasDigits = false
    let decimal = 0
    while (!this.isEOF()) {
      const ch = this.char()
      if (ch >= 48 /* `0` */ && ch <= 57 /* `9` */) {
        hasDigits = true
        decimal = decimal * 10 + (ch - 48)
        this.bump()
      } else {
        break
      }
    }

    const location = createLocation(startingPosition, this.clonePosition())

    if (!hasDigits) {
      return this.error(expectNumberError, location)
    }

    decimal *= sign
    if (!isSafeInteger(decimal)) {
      return this.error(invalidNumberError, location)
    }

    return {val: decimal, err: null}
  }

  private offset(): number {
    return this.position.offset
  }

  private isEOF(): boolean {
    return this.offset() === this.message.length
  }

  private clonePosition(): Position {
    // This is much faster than `Object.assign` or spread.
    return {
      offset: this.position.offset,
      line: this.position.line,
      column: this.position.column,
    }
  }

  /**
   * Return the code point at the current position of the parser.
   * Throws if the index is out of bound.
   */
  private char(): number {
    const offset = this.position.offset
    if (offset >= this.message.length) {
      throw Error('out of bound')
    }
    const code = codePointAt(this.message, offset)
    if (code === undefined) {
      throw Error(`Offset ${offset} is at invalid UTF-16 code unit boundary`)
    }
    return code
  }

  private error(
    kind: ErrorKind,
    location: Location
  ): Result<never, ParserError> {
    return {
      val: null,
      err: {
        kind,
        message: this.message,
        location,
      },
    }
  }

  /** Bump the parser to the next UTF-16 code unit. */
  private bump(): void {
    if (this.isEOF()) {
      return
    }
    const code = this.char()
    if (code === 10 /* '\n' */) {
      this.position.line += 1
      this.position.column = 1
      this.position.offset += 1
    } else {
      this.position.column += 1
      // 0 ~ 0x10000 -> unicode BMP, otherwise skip the surrogate pair.
      this.position.offset += code < 0x10000 ? 1 : 2
    }
  }

  /**
   * If the substring starting at the current position of the parser has
   * the given prefix, then bump the parser to the character immediately
   * following the prefix and return true. Otherwise, don't bump the parser
   * and return false.
   */
  private bumpIf(prefix: string): boolean {
    if (startsWith(this.message, prefix, this.offset())) {
      for (let i = 0; i < prefix.length; i++) {
        this.bump()
      }
      return true
    }
    return false
  }

  /**
   * Bump the parser until the pattern character is found and return `true`.
   * Otherwise bump to the end of the file and return `false`.
   */
  private bumpUntil(pattern: string): boolean {
    const currentOffset = this.offset()
    const index = this.message.indexOf(pattern, currentOffset)
    if (index >= 0) {
      this.bumpTo(index)
      return true
    } else {
      this.bumpTo(this.message.length)
      return false
    }
  }

  /**
   * Bump the parser to the target offset.
   * If target offset is beyond the end of the input, bump the parser to the end of the input.
   */
  private bumpTo(targetOffset: number) {
    if (this.offset() > targetOffset) {
      throw Error(
        `targetOffset ${targetOffset} must be greater than or equal to the current offset ${this.offset()}`
      )
    }

    targetOffset = Math.min(targetOffset, this.message.length)
    while (true) {
      const offset = this.offset()
      if (offset === targetOffset) {
        break
      }
      if (offset > targetOffset) {
        throw Error(
          `targetOffset ${targetOffset} is at invalid UTF-16 code unit boundary`
        )
      }

      this.bump()
      if (this.isEOF()) {
        break
      }
    }
  }

  /** advance the parser through all whitespace to the next non-whitespace code unit. */
  private bumpSpace() {
    while (!this.isEOF() && _isWhiteSpace(this.char())) {
      this.bump()
    }
  }

  /**
   * Peek at the *next* Unicode codepoint in the input without advancing the parser.
   * If the input has been exhausted, then this returns null.
   */
  private peek(): number | null {
    if (this.isEOF()) {
      return null
    }
    const code = this.char()
    const offset = this.offset()
    const nextCode = this.message.charCodeAt(offset + (code >= 0x10000 ? 2 : 1))
    return nextCode ?? null
  }
}

/**
 * This check if codepoint is alphabet (lower & uppercase)
 * @param codepoint
 * @returns
 */
function _isAlpha(codepoint: number): boolean {
  return (
    (codepoint >= 97 && codepoint <= 122) ||
    (codepoint >= 65 && codepoint <= 90)
  )
}

function _isAlphaOrSlash(codepoint: number): boolean {
  return _isAlpha(codepoint) || codepoint === 47 /* '/' */
}

/** See `parseTag` function docs. */
function _isPotentialElementNameChar(c: number): boolean {
  return (
    c === 45 /* '-' */ ||
    c === 46 /* '.' */ ||
    (c >= 48 && c <= 57) /* 0..9 */ ||
    c === 95 /* '_' */ ||
    (c >= 97 && c <= 122) /** a..z */ ||
    (c >= 65 && c <= 90) /* A..Z */ ||
    c == 0xb7 ||
    (c >= 0xc0 && c <= 0xd6) ||
    (c >= 0xd8 && c <= 0xf6) ||
    (c >= 0xf8 && c <= 0x37d) ||
    (c >= 0x37f && c <= 0x1fff) ||
    (c >= 0x200c && c <= 0x200d) ||
    (c >= 0x203f && c <= 0x2040) ||
    (c >= 0x2070 && c <= 0x218f) ||
    (c >= 0x2c00 && c <= 0x2fef) ||
    (c >= 0x3001 && c <= 0xd7ff) ||
    (c >= 0xf900 && c <= 0xfdcf) ||
    (c >= 0xfdf0 && c <= 0xfffd) ||
    (c >= 0x10000 && c <= 0xeffff)
  )
}

/**
 * Code point equivalent of regex `\p{White_Space}`.
 * From: https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
 */
function _isWhiteSpace(c: number) {
  return (
    (c >= 0x0009 && c <= 0x000d) ||
    c === 0x0020 ||
    c === 0x0085 ||
    (c >= 0x200e && c <= 0x200f) ||
    c === 0x2028 ||
    c === 0x2029
  )
}

/**
 * Code point equivalent of regex `\p{Pattern_Syntax}`.
 * See https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
 */
function _isPatternSyntax(c: number): boolean {
  return (
    (c >= 0x0021 && c <= 0x0023) ||
    c === 0x0024 ||
    (c >= 0x0025 && c <= 0x0027) ||
    c === 0x0028 ||
    c === 0x0029 ||
    c === 0x002a ||
    c === 0x002b ||
    c === 0x002c ||
    c === 0x002d ||
    (c >= 0x002e && c <= 0x002f) ||
    (c >= 0x003a && c <= 0x003b) ||
    (c >= 0x003c && c <= 0x003e) ||
    (c >= 0x003f && c <= 0x0040) ||
    c === 0x005b ||
    c === 0x005c ||
    c === 0x005d ||
    c === 0x005e ||
    c === 0x0060 ||
    c === 0x007b ||
    c === 0x007c ||
    c === 0x007d ||
    c === 0x007e ||
    c === 0x00a1 ||
    (c >= 0x00a2 && c <= 0x00a5) ||
    c === 0x00a6 ||
    c === 0x00a7 ||
    c === 0x00a9 ||
    c === 0x00ab ||
    c === 0x00ac ||
    c === 0x00ae ||
    c === 0x00b0 ||
    c === 0x00b1 ||
    c === 0x00b6 ||
    c === 0x00bb ||
    c === 0x00bf ||
    c === 0x00d7 ||
    c === 0x00f7 ||
    (c >= 0x2010 && c <= 0x2015) ||
    (c >= 0x2016 && c <= 0x2017) ||
    c === 0x2018 ||
    c === 0x2019 ||
    c === 0x201a ||
    (c >= 0x201b && c <= 0x201c) ||
    c === 0x201d ||
    c === 0x201e ||
    c === 0x201f ||
    (c >= 0x2020 && c <= 0x2027) ||
    (c >= 0x2030 && c <= 0x2038) ||
    c === 0x2039 ||
    c === 0x203a ||
    (c >= 0x203b && c <= 0x203e) ||
    (c >= 0x2041 && c <= 0x2043) ||
    c === 0x2044 ||
    c === 0x2045 ||
    c === 0x2046 ||
    (c >= 0x2047 && c <= 0x2051) ||
    c === 0x2052 ||
    c === 0x2053 ||
    (c >= 0x2055 && c <= 0x205e) ||
    (c >= 0x2190 && c <= 0x2194) ||
    (c >= 0x2195 && c <= 0x2199) ||
    (c >= 0x219a && c <= 0x219b) ||
    (c >= 0x219c && c <= 0x219f) ||
    c === 0x21a0 ||
    (c >= 0x21a1 && c <= 0x21a2) ||
    c === 0x21a3 ||
    (c >= 0x21a4 && c <= 0x21a5) ||
    c === 0x21a6 ||
    (c >= 0x21a7 && c <= 0x21ad) ||
    c === 0x21ae ||
    (c >= 0x21af && c <= 0x21cd) ||
    (c >= 0x21ce && c <= 0x21cf) ||
    (c >= 0x21d0 && c <= 0x21d1) ||
    c === 0x21d2 ||
    c === 0x21d3 ||
    c === 0x21d4 ||
    (c >= 0x21d5 && c <= 0x21f3) ||
    (c >= 0x21f4 && c <= 0x22ff) ||
    (c >= 0x2300 && c <= 0x2307) ||
    c === 0x2308 ||
    c === 0x2309 ||
    c === 0x230a ||
    c === 0x230b ||
    (c >= 0x230c && c <= 0x231f) ||
    (c >= 0x2320 && c <= 0x2321) ||
    (c >= 0x2322 && c <= 0x2328) ||
    c === 0x2329 ||
    c === 0x232a ||
    (c >= 0x232b && c <= 0x237b) ||
    c === 0x237c ||
    (c >= 0x237d && c <= 0x239a) ||
    (c >= 0x239b && c <= 0x23b3) ||
    (c >= 0x23b4 && c <= 0x23db) ||
    (c >= 0x23dc && c <= 0x23e1) ||
    (c >= 0x23e2 && c <= 0x2426) ||
    (c >= 0x2427 && c <= 0x243f) ||
    (c >= 0x2440 && c <= 0x244a) ||
    (c >= 0x244b && c <= 0x245f) ||
    (c >= 0x2500 && c <= 0x25b6) ||
    c === 0x25b7 ||
    (c >= 0x25b8 && c <= 0x25c0) ||
    c === 0x25c1 ||
    (c >= 0x25c2 && c <= 0x25f7) ||
    (c >= 0x25f8 && c <= 0x25ff) ||
    (c >= 0x2600 && c <= 0x266e) ||
    c === 0x266f ||
    (c >= 0x2670 && c <= 0x2767) ||
    c === 0x2768 ||
    c === 0x2769 ||
    c === 0x276a ||
    c === 0x276b ||
    c === 0x276c ||
    c === 0x276d ||
    c === 0x276e ||
    c === 0x276f ||
    c === 0x2770 ||
    c === 0x2771 ||
    c === 0x2772 ||
    c === 0x2773 ||
    c === 0x2774 ||
    c === 0x2775 ||
    (c >= 0x2794 && c <= 0x27bf) ||
    (c >= 0x27c0 && c <= 0x27c4) ||
    c === 0x27c5 ||
    c === 0x27c6 ||
    (c >= 0x27c7 && c <= 0x27e5) ||
    c === 0x27e6 ||
    c === 0x27e7 ||
    c === 0x27e8 ||
    c === 0x27e9 ||
    c === 0x27ea ||
    c === 0x27eb ||
    c === 0x27ec ||
    c === 0x27ed ||
    c === 0x27ee ||
    c === 0x27ef ||
    (c >= 0x27f0 && c <= 0x27ff) ||
    (c >= 0x2800 && c <= 0x28ff) ||
    (c >= 0x2900 && c <= 0x2982) ||
    c === 0x2983 ||
    c === 0x2984 ||
    c === 0x2985 ||
    c === 0x2986 ||
    c === 0x2987 ||
    c === 0x2988 ||
    c === 0x2989 ||
    c === 0x298a ||
    c === 0x298b ||
    c === 0x298c ||
    c === 0x298d ||
    c === 0x298e ||
    c === 0x298f ||
    c === 0x2990 ||
    c === 0x2991 ||
    c === 0x2992 ||
    c === 0x2993 ||
    c === 0x2994 ||
    c === 0x2995 ||
    c === 0x2996 ||
    c === 0x2997 ||
    c === 0x2998 ||
    (c >= 0x2999 && c <= 0x29d7) ||
    c === 0x29d8 ||
    c === 0x29d9 ||
    c === 0x29da ||
    c === 0x29db ||
    (c >= 0x29dc && c <= 0x29fb) ||
    c === 0x29fc ||
    c === 0x29fd ||
    (c >= 0x29fe && c <= 0x2aff) ||
    (c >= 0x2b00 && c <= 0x2b2f) ||
    (c >= 0x2b30 && c <= 0x2b44) ||
    (c >= 0x2b45 && c <= 0x2b46) ||
    (c >= 0x2b47 && c <= 0x2b4c) ||
    (c >= 0x2b4d && c <= 0x2b73) ||
    (c >= 0x2b74 && c <= 0x2b75) ||
    (c >= 0x2b76 && c <= 0x2b95) ||
    c === 0x2b96 ||
    (c >= 0x2b97 && c <= 0x2bff) ||
    (c >= 0x2e00 && c <= 0x2e01) ||
    c === 0x2e02 ||
    c === 0x2e03 ||
    c === 0x2e04 ||
    c === 0x2e05 ||
    (c >= 0x2e06 && c <= 0x2e08) ||
    c === 0x2e09 ||
    c === 0x2e0a ||
    c === 0x2e0b ||
    c === 0x2e0c ||
    c === 0x2e0d ||
    (c >= 0x2e0e && c <= 0x2e16) ||
    c === 0x2e17 ||
    (c >= 0x2e18 && c <= 0x2e19) ||
    c === 0x2e1a ||
    c === 0x2e1b ||
    c === 0x2e1c ||
    c === 0x2e1d ||
    (c >= 0x2e1e && c <= 0x2e1f) ||
    c === 0x2e20 ||
    c === 0x2e21 ||
    c === 0x2e22 ||
    c === 0x2e23 ||
    c === 0x2e24 ||
    c === 0x2e25 ||
    c === 0x2e26 ||
    c === 0x2e27 ||
    c === 0x2e28 ||
    c === 0x2e29 ||
    (c >= 0x2e2a && c <= 0x2e2e) ||
    c === 0x2e2f ||
    (c >= 0x2e30 && c <= 0x2e39) ||
    (c >= 0x2e3a && c <= 0x2e3b) ||
    (c >= 0x2e3c && c <= 0x2e3f) ||
    c === 0x2e40 ||
    c === 0x2e41 ||
    c === 0x2e42 ||
    (c >= 0x2e43 && c <= 0x2e4f) ||
    (c >= 0x2e50 && c <= 0x2e51) ||
    c === 0x2e52 ||
    (c >= 0x2e53 && c <= 0x2e7f) ||
    (c >= 0x3001 && c <= 0x3003) ||
    c === 0x3008 ||
    c === 0x3009 ||
    c === 0x300a ||
    c === 0x300b ||
    c === 0x300c ||
    c === 0x300d ||
    c === 0x300e ||
    c === 0x300f ||
    c === 0x3010 ||
    c === 0x3011 ||
    (c >= 0x3012 && c <= 0x3013) ||
    c === 0x3014 ||
    c === 0x3015 ||
    c === 0x3016 ||
    c === 0x3017 ||
    c === 0x3018 ||
    c === 0x3019 ||
    c === 0x301a ||
    c === 0x301b ||
    c === 0x301c ||
    c === 0x301d ||
    (c >= 0x301e && c <= 0x301f) ||
    c === 0x3020 ||
    c === 0x3030 ||
    c === 0xfd3e ||
    c === 0xfd3f ||
    (c >= 0xfe45 && c <= 0xfe46)
  )
}
