import {pegParse, ParseOptions} from '../src';
import {printAST} from '../src/printer';

function allTests(opts?: ParseOptions) {
  [
    'Hello, World!',
    'Hello, {name}!',
    'My name is {FIRST} {LAST}, age {age, number}, time {time, time}, date {date, date}.',
    '{num, number, percent}',
    '{count, time}',
    '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}',
    'Foo {var1, plural, =0{# var1} other{{var2, plural, =0{# var2} other{# var2-other}} # other}}',
    '{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor',
    '{gender, select, female {woman} male {man} other {person}}',
    '   some random test   ',
    '{  num , number,percent  }',
    '{c, plural, =1 { {text} project} other { {text} projects}}',
    '{c, plural, offset:-2 =-1 { {text} project} other { {text} projects}}', // negative
    '{c, plural, =99 { {text} project} other { {text} projects}}',
    `'{'`,
    `'}'`,
    // Escaping "#" needs to be special-cased so it remains escaped so
    // the runtime doesn't replace it when in a `pluralFormat` option.
    `'#'`,
    /**
     * @see http://userguide.icu-project.org/formatpegParse/messages#TOC-Quoting-Escaping
     * @see https://github.com/formatjs/formatjs/issues/97
     */
    "This '{isn''t}' obvious",
    "'{name}'",
    'this is {count,plural,offset:1 one{{count, number} dog} other{{count, number} dogs}}',
    `{type, select,
      drop {
        {units, plural,
          one {# drop}
          other {# drops}
        }
      }
      teaspoon {
        {units, plural,
          one {# teaspoon}
          other {# teaspoons}
        }
      }
      tablespoon {
        {units, plural,
          one {# tablespoon}
          other {# tablespoons}
        }
      }
    }`,
    '{howMany, select,\
      one {{actor1}}\
      other {\
          {nExtraActors, plural,\
          one {{actor1} and {actor2}}\
          other {{actor1} and {nExtraActors} others}\
          }}\
      } shared this file.',
  ].forEach(mess => {
    const ast = pegParse(mess, opts);
    it(`can pegParse '${mess}'`, function() {
      expect(ast).toMatchSnapshot();
    });
    it(`can print AST from '${mess}'`, function() {
      expect(printAST(ast)).toMatchSnapshot();
    });
  });
}

describe('pegParse()', function() {
  allTests();
});

describe('pegParse({ captureLocation: true })', function() {
  allTests();
});
