import { parse, ParseOptions } from '../src';

function allTests(opts?: ParseOptions) {
  it('parse("Hello, World!")', function() {
    expect(parse('Hello, World!', opts)).toMatchSnapshot();
  });

  it('parse("Hello, {name}!")', function() {
    expect(parse('Hello, {name}!', opts)).toMatchSnapshot();
  });

  it('simple formats', function() {
    expect(
      parse(
        'My name is {FIRST} {LAST}, age {age, number}, time {time, time}, date {date, date}.'
      )
    ).toMatchSnapshot();
  });

  it('parse("{num, number, percent}")', function() {
    expect(parse('{num, number, percent}', opts)).toMatchSnapshot();
  });

  it('parse("{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}")', function() {
    expect(
      parse(
        '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}',
        opts
      )
    ).toMatchSnapshot();
  });

  it('nested plural', function() {
    expect(
      parse(
        'Foo {var1, plural, =0{# var1} other{{var2, plural, =0{# var2} other{# var2-other}} # other}}',
        opts
      )
    ).toMatchSnapshot();
  });

  it('parse("{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor")', function() {
    expect(
      parse(
        '{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor',
        opts
      )
    ).toMatchSnapshot();
  });

  it('parse("{gender, select, female {woman} male {man} other {person}}")', function() {
    expect(
      parse('{gender, select, female {woman} male {man} other {person}}', opts)
    ).toMatchSnapshot();
  });

  describe('whitespace', function() {
    it('should allow whitespace in and around `literalElement`s', function() {
      expect(parse('   some random test   ', opts)).toMatchSnapshot();
    });

    it('should allow whitespace in `argumentElement`s', function() {
      expect(parse('{  num , number,percent  }', opts)).toMatchSnapshot();
    });
    it('should capture whitespace in nested pattern', function() {
      expect(
        parse(
          '{c, plural, =1 { {text} project} other { {text} projects}}',
          opts
        )
      ).toMatchSnapshot();
    });
  });

  describe('escaping', function() {
    it('should allow escaping of syntax chars via `\\\\`', function() {
      expect(parse('\\{', opts)).toMatchSnapshot();
      expect(parse('\\}', opts)).toMatchSnapshot();
      expect(parse('\\u003C', opts)).toMatchSnapshot();

      // Escaping "#" needs to be special-cased so it remains escaped so
      // the runtime doesn't replace it when in a `pluralFormat` option.
      expect(parse('\\#', opts)).toMatchSnapshot();
    });

    it('should allow backslash chars in `literalElement`s', function() {
      expect(parse('\\u005c', opts)).toMatchSnapshot();
      expect(parse('\\\\', opts)).toMatchSnapshot();
    });

    /**
     * @see http://userguide.icu-project.org/formatparse/messages#TOC-Quoting-Escaping
     * @see https://github.com/formatjs/formatjs/issues/97
     */
    it('should escape a pair of ASCII apostrophes to represent one ASCII apostrophe', function() {
      expect(parse("This '{isn''t}' obvious", opts)).toMatchSnapshot();
      expect(parse("''{name}''", opts)).toMatchSnapshot();
      expect(parse("''{name}''", opts)).toMatchSnapshot();
    });
  });
}

describe('parse()', function() {
  allTests();
});

describe('parse({ captureLocation: true })', function() {
  allTests();
});
