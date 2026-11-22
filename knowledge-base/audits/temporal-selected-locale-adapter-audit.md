# Selected formats and fresh Duration locale adapters

Frozen Temporal comparison §§15.6.5,15.6.7 and15.11.1.1 step3. Requested
ECMA-262 authority and comparison-source distinction remain unchanged. This
batch corrects existing private adapters, reusing runtime operations and the
existing Intl, CLDR, parser and matcher algorithms.

## Public failures and corrections

Cold selected-kind formatting reached `matchRangeWidths` through mutable keys,
Array iteration/map and String prefix/suffix methods. Five cold controls failed;
five warm controls passed. Captured native methods and indexed private Lists
retain interval part order and metadata.

Basic/BestFit component selection reached private Array iteration/isArray and
Math min/max. Eight cold controls failed; eight warm controls passed. Scoring,
penalties, candidate order and tie handling remain unchanged. Basic output is
`1/2/2024, 3:04:05`; best-fit output is `01/02/2024, 03:04:05`. An earlier
fixture incorrectly expected padded basic output; those assertion failures are
not runtime defects.

Re-registering unchanged real en data creates fresh lazy interval candidates.
Constructing a combined date/time formatter initializes its chosen candidate;
first PlainTime use selects another. A getter replacing Object.defineProperties
then threw in initializeRanges, through BasicFormatMatcher/getTemporalFormat.
Main-pattern cache registration did not cover that lazy interval initializer.
The correction captures native Object/String/Map/Math operations and indexes
private Lists. Existing token parsing, fallback placeholders, repeated-field
spans, reversed sources, year-field filtering and lazy accessors remain intact.

Fresh Duration construction had two keyword-find failures and eight outer
locale-adapter failures. Controls use a fresh available-locale Set and real
NumberFormat subclass, literal `1 minute`, and the original27 locale/options
Get/coercion trace. Captured find/isArray/Set operations and own keyword appends
reuse existing matching. Set snapshots retain size plus ordered-content
invalidation, including equal-size replacement/reordering and foreign Sets.

The owning DateTimeFormat renderer tests supplied obsolete NumberFormat objects
after the previous bound-function cache change. Fixtures now supply real bound
format functions. This changes test setup, not runtime behavior.

The owning shared-package typecheck also exposed four existing bigint literals
under its ES2019 target. They now use captured bigIntFrom with exact integer
constants below2^53. Composition remains bigint throughout; no fractional or
nanosecond value passes through Number.

## Combined date and time styles

The public `timeStyle` getter can replace prototype methods just before
combined-style construction. Eight controls reproduce calls to mutable
Object, Array or String operations during that private work. The getter
still runs once. Indexed traversal and null-prototype records keep the
component check and interval assembly private. Connector substitution uses
captured search and slicing operations, preserving the literal pattern text
without dispatching to `Symbol.replace`.

The tests restore the original methods before rendering the result. They
compare all parts for a date difference and for a time difference under
the same style pair. Existing CLDR format selection and source tagging still
supply the assembled intervals.
[ECMA-402 §11.5.1 steps 4.e, 4.g.i and 4.h–j](https://tc39.es/ecma402/#sec-datetimestyleformat).
[Temporal comparison §15.4.1 steps 45.a and 45.e](https://tc39.es/proposal-temporal/#sec-createdatetimeformat).
[Literal substitution](../../packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.ts#L30).
[Private interval assembly](../../packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.ts#L46).
[Component guard](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L568).
[Public constructor tests](../../packages/intl-datetimeformat/tests/index.test.ts#L477).

## Scope and evidence

Current source/test hashes, exact validation and regression-log hashes belong in
`temporal-selected-locale-adapter-source-evidence.json`. Earlier checkpoint
evidence remains historical; it is not rebound to these changed files.

Existing LocaleMatcher mutation/reordering/foreign-Set controls and DateTimeFormat
range tests supply semantic regression coverage. Public cold/warm controls
exercise actual Temporal entry points. Annotation-only calendar/provider changes
have separate comment-insensitive source proofs and earn no behavioral credit.

Fresh Duration constructor §15.11.1.1 step3 remains conditional. Lookup removal,
Unicode parse/reinsertion, canonicalization/maximization and later best-fit
snapshot/cache adapters remain named local dependencies. Precreated formatter
invocation does not prove fresh construction. No new matching engine or generic
Intl implementation is required.

Six selected-kind steps now reuse the registered CLDR parser and pattern
partition contracts after validation of the private matching and lazy interval
operations. This reconciliation covers the actual selected-kind callers. Locale
registration, range zone policy and fresh Duration construction retain their
separate obligations. The 21-target run recovered cached passing results.
A separate run on the landed checkpoint recovered cached passes for both wider
Hermes Intl compatibility targets (source and bytecode).
