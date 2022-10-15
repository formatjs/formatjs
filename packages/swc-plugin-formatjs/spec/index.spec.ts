import { test } from "@jest/globals";
import * as path from "path";
import {
  ExtractedMessageDescriptor,
  transform,
  transformAndCheck,
} from "./transform";

const getFixturePath = (fixtureName: string) =>
  path.resolve(__dirname, "fixtures", fixtureName);

test("additionalComponentNames", function () {
  expect(
    transformAndCheck("additionalComponentNames", {
      additionalComponentNames: ["CustomMessage"],
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    function CustomMessage() {}
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(CustomMessage, {
                id: "greeting-world",
                defaultMessage: "Hello World!"
            });
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "Greeting to the world",
            "id": "greeting-world",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("additionalFunctionNames", function () {
  expect(
    transformAndCheck("additionalFunctionNames", {
      additionalFunctionNames: ["t"],
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "// @react-intl project:foo
    import React, { Component } from 'react';
    function CustomMessage() {}
    export default class Foo extends Component {
        render() {
            t({
                id: "mfl9RV",
                defaultMessage: "t"
            });
            return /*#__PURE__*/ React.createElement(CustomMessage, {
                id: formatMessage({
                    id: "9/u6bg",
                    defaultMessage: "foo"
                }),
                description: $formatMessage({
                    id: "3jMyCE",
                    defaultMessage: "foo2"
                }),
                defaultMessage: "Hello World!"
            });
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "t",
            "id": "mfl9RV",
          },
          {
            "defaultMessage": "foo",
            "id": "9/u6bg",
          },
          {
            "defaultMessage": "foo2",
            "id": "3jMyCE",
          },
        ],
        "meta": {
          "project": "foo",
        },
      },
    }
  `);
});

test("ast", function () {
  expect(
    transformAndCheck("ast", {
      ast: true,
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage, defineMessage, defineMessages } from 'react-intl';
    defineMessage({
        id: 'defineMessage',
        defaultMessage: '[{"type":0,"value":"this is a "},{"type":3,"value":"dt","style":"full"}]'
    });
    defineMessages({
        foo: {
            id: 'defineMessages1',
            defaultMessage: '[{"type":0,"value":"this is a "},{"type":4,"value":"dt","style":"full"}]'
        },
        bar: {
            id: 'defineMessages2',
            defaultMessage: '[{"type":0,"value":"this is a "},{"type":2,"value":"dt"}]'
        },
        baz: {
            id: 'compiled',
            defaultMessage: [
                {
                    type: 0,
                    value: 'asd'
                }
            ]
        }
    });
    export default class Foo extends Component {
        render() {
            Intl.formatMessage({
                id: 'intl.formatMessage',
                defaultMessage: '[{"type":0,"value":"foo "},{"type":6,"value":"s","options":{"one":{"value":[{"type":0,"value":"1"}]},"other":{"value":[{"type":0,"value":"2"}]}},"offset":0,"pluralType":"cardinal"}]'
            });
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: "Hello World!"
            }), /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "compiled2",
                defaultMessage: [
                    {
                        type: 0,
                        value: 'compiled comp'
                    }
                ]
            }));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "this is a {dt, date, full}",
            "id": "defineMessage",
          },
          {
            "defaultMessage": "this is a {dt, time, full}",
            "id": "defineMessages1",
          },
          {
            "defaultMessage": "this is a {dt, number}",
            "id": "defineMessages2",
          },
          {
            "defaultMessage": "foo {s, plural, one{1} other{2}}",
            "id": "intl.formatMessage",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "The default message.",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "",
            "description": "The default message.",
            "id": "compiled2",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("defineMessage", function () {
  expect(transformAndCheck("defineMessage")).toMatchInlineSnapshot(`
    {
      "code": "// @react-intl project:amazing
    function _extends() {
        _extends = Object.assign || function(target) {
            for(var i = 1; i < arguments.length; i++){
                var source = arguments[i];
                for(var key in source){
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        return _extends.apply(this, arguments);
    }
    import React, { Component } from 'react';
    import { defineMessage, FormattedMessage } from 'react-intl';
    const msgs = {
        header: defineMessage({
            id: 'foo.bar.baz',
            defaultMessage: "Hello World!"
        }),
        content: defineMessage({
            id: 'foo.bar.biff',
            defaultMessage: "Hello Nurse!"
        }),
        kittens: defineMessage({
            id: 'app.home.kittens',
            defaultMessage: "{count, plural, =0 {😭} one {# kitten} other {# kittens}}"
        }),
        trailingWhitespace: defineMessage({
            id: 'trailing.ws',
            defaultMessage: "Some whitespace"
        }),
        escaped: defineMessage({
            id: 'escaped.apostrophe',
            defaultMessage: "A quoted value ''{value}'"
        }),
        stringKeys: defineMessage({
            // prettier-ignore
            'id': 'string.key.id',
            // prettier-ignore
            'defaultMessage': "This is message"
        })
    };
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.header))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.content))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.kittens))));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": "Another message",
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "{count, plural, =0 {😭} one {# kitten} other {# kittens}}",
            "description": "Counts kittens",
            "id": "app.home.kittens",
          },
          {
            "defaultMessage": "Some whitespace",
            "description": "Whitespace",
            "id": "trailing.ws",
          },
          {
            "defaultMessage": "A quoted value ''{value}'",
            "description": "Escaped apostrophe",
            "id": "escaped.apostrophe",
          },
          {
            "defaultMessage": "This is message",
            "description": "Keys as a string literal",
            "id": "string.key.id",
          },
        ],
        "meta": {
          "project": "amazing",
        },
      },
    }
  `);
});

test("descriptionsAsObjects", function () {
  expect(transformAndCheck("descriptionsAsObjects")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage } from 'react-intl';
    // @react-intl project:amazing2
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: "Hello World!"
            });
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": {
              "metadata": "Additional metadata content.",
              "text": "Something for the translator.",
            },
            "id": "foo.bar.baz",
          },
        ],
        "meta": {
          "project": "amazing2",
        },
      },
    }
  `);
});

test("defineMessages", function () {
  expect(transformAndCheck("defineMessages")).toMatchInlineSnapshot(`
    {
      "code": "// @react-intl project:amazing
    function _extends() {
        _extends = Object.assign || function(target) {
            for(var i = 1; i < arguments.length; i++){
                var source = arguments[i];
                for(var key in source){
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        return _extends.apply(this, arguments);
    }
    import React, { Component } from 'react';
    import { defineMessages, FormattedMessage } from 'react-intl';
    const msgs = defineMessages({
        header: {
            id: 'foo.bar.baz',
            defaultMessage: "Hello World!"
        },
        content: {
            id: 'foo.bar.biff',
            defaultMessage: "Hello Nurse!"
        },
        kittens: {
            id: 'app.home.kittens',
            defaultMessage: "{count, plural, =0 {😭} one {# kitten} other {# kittens}}"
        },
        trailingWhitespace: {
            id: 'trailing.ws',
            defaultMessage: "Some whitespace"
        },
        escaped: {
            id: 'escaped.apostrophe',
            defaultMessage: "A quoted value ''{value}'"
        }
    });
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.header))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.content))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.kittens))));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": "Another message",
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "{count, plural, =0 {😭} one {# kitten} other {# kittens}}",
            "description": "Counts kittens",
            "id": "app.home.kittens",
          },
          {
            "defaultMessage": "Some whitespace",
            "description": "Whitespace",
            "id": "trailing.ws",
          },
          {
            "defaultMessage": "A quoted value ''{value}'",
            "description": "Escaped apostrophe",
            "id": "escaped.apostrophe",
          },
        ],
        "meta": {
          "project": "amazing",
        },
      },
    }
  `);
});

test("empty", function () {
  expect(transformAndCheck("empty")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { defineMessage } from 'react-intl';
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null);
        }
    }",
      "data": {
        "messages": [],
        "meta": {},
      },
    }
  `);
});

test("extractFromFormatMessageCall", function () {
  expect(transformAndCheck("extractFromFormatMessageCall"))
    .toMatchInlineSnapshot(`
    {
      "code": "import { FormattedMessage, injectIntl } from 'react-intl';
    import React, { Component } from 'react';
    const objectPointer = {
        id: 'foo.bar.invalid',
        defaultMessage: 'This cannot be extracted',
        description: 'the plugin only supports inline objects'
    };
    class Foo extends Component {
        render() {
            const { intl  } = this.props;
            const { intl: { formatMessage  } ,  } = this.props;
            const msgs = {
                baz: this.props.intl.formatMessage({
                    id: 'foo.bar.baz',
                    defaultMessage: "Hello World!"
                }),
                biff: intl.formatMessage({
                    id: 'foo.bar.biff',
                    defaultMessage: "Hello Nurse!"
                }),
                qux: formatMessage({
                    id: 'foo.bar.qux',
                    defaultMessage: "Hello Stranger!"
                }),
                invalid: this.props.intl.formatMessage(objectPointer)
            };
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, msgs.header), /*#__PURE__*/ React.createElement("p", null, msgs.content), /*#__PURE__*/ React.createElement("span", null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo",
                defaultMessage: "bar"
            })));
        }
    }
    export default injectIntl(Foo)",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": "Another message",
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "Hello Stranger!",
            "description": "A different message",
            "id": "foo.bar.qux",
          },
          {
            "defaultMessage": "bar",
            "description": "baz",
            "id": "foo",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("extractFromFormatMessageCallStateless", function () {
  expect(transformAndCheck("extractFromFormatMessageCallStateless"))
    .toMatchInlineSnapshot(`
    {
      "code": "import { FormattedMessage, injectIntl, useIntl } from 'react-intl';
    import React from 'react';
    function myFunction(param1, { formatMessage , formatDate  }) {
        return formatMessage({
            id: 'inline1',
            defaultMessage: "Hello params!"
        }) + formatDate(new Date());
    }
    const child = myFunction(filterable, intl);
    function SFC() {
        const { formatMessage  } = useIntl();
        return formatMessage({
            id: 'hook',
            defaultMessage: "hook <b>foo</b>"
        });
    }
    const Foo = ({ intl: { formatMessage  }  })=>{
        const msgs = {
            qux: formatMessage({
                id: 'foo.bar.quux',
                defaultMessage: "Hello <b>Stateless!</b>"
            })
        };
        return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, msgs.header), /*#__PURE__*/ React.createElement("p", null, msgs.content), /*#__PURE__*/ React.createElement("span", null, /*#__PURE__*/ React.createElement(FormattedMessage, {
            id: "foo",
            defaultMessage: "bar"
        })));
    };
    export default injectIntl(Foo)",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello params!",
            "description": "A stateless message",
            "id": "inline1",
          },
          {
            "defaultMessage": "hook <b>foo</b>",
            "description": "hook",
            "id": "hook",
          },
          {
            "defaultMessage": "Hello <b>Stateless!</b>",
            "description": "A stateless message",
            "id": "foo.bar.quux",
          },
          {
            "defaultMessage": "bar",
            "description": "baz",
            "id": "foo",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("formatMessageCall", function () {
  expect(transformAndCheck("formatMessageCall")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { injectIntl, FormattedMessage } from 'react-intl';
    const objectPointer = {
        id: 'foo.bar.invalid',
        defaultMessage: 'This cannot be extracted',
        description: 'the plugin only supports inline objects'
    };
    class Foo extends Component {
        render() {
            const msgs = {
                baz: this.props.intl.formatMessage({
                    id: 'foo.bar.baz',
                    defaultMessage: "Hello World!"
                }),
                biff: this.props.intl.formatMessage({
                    id: 'foo.bar.biff',
                    defaultMessage: "Hello Nurse!"
                }),
                invalid: this.props.intl.formatMessage(objectPointer)
            };
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, msgs.header), /*#__PURE__*/ React.createElement("p", null, msgs.content), /*#__PURE__*/ React.createElement("span", null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo",
                defaultMessage: "bar"
            })));
        }
    }
    export default injectIntl(Foo)",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": "Another message",
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "bar",
            "description": "baz",
            "id": "foo",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("FormattedMessage", function () {
  expect(transformAndCheck("FormattedMessage")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage } from 'react-intl';
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: "Hello World!"
            });
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message.",
            "id": "foo.bar.baz",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("inline", function () {
  expect(transformAndCheck("inline")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage, defineMessage } from 'react-intl';
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: "Hello World!"
            }), defineMessage({
                id: 'header',
                defaultMessage: "Hello World!"
            }), defineMessage({
                id: 'header2',
                defaultMessage: "Hello World!"
            }));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message.",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "header",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "header2",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("templateLiteral", function () {
  expect(transformAndCheck("templateLiteral")).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage, defineMessage } from 'react-intl';
    defineMessage({
        id: \`template\`,
        defaultMessage: "should remove newline and extra spaces"
    });
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: \`Hello World!\`
            });
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "should remove newline and extra spaces",
            "id": "template",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "The default message.",
            "id": "foo.bar.baz",
          },
        ],
        "meta": {},
      },
    }
  `);
});

// NOT FULLY IMPLEMENTED
test.skip("idInterpolationPattern", function () {
  transformAndCheck("idInterpolationPattern", {
    idInterpolationPattern: "[folder].[name].[sha512:contenthash:hex:6]",
  });
});

test("idInterpolationPattern default", function () {
  expect(transformAndCheck("idInterpolationPattern")).toMatchInlineSnapshot(`
    {
      "code": "function _extends() {
        _extends = Object.assign || function(target) {
            for(var i = 1; i < arguments.length; i++){
                var source = arguments[i];
                for(var key in source){
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        return _extends.apply(this, arguments);
    }
    import React, { Component } from 'react';
    import { defineMessages, FormattedMessage } from 'react-intl';
    const msgs = defineMessages({
        header: {
            id: "TRRgnX",
            defaultMessage: "Hello World!"
        },
        content: {
            id: 'foo.bar.biff',
            defaultMessage: "Hello Nurse!"
        }
    });
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.header))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.content))), /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "NqjIBK",
                defaultMessage: "Hello World!"
            }), /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "XOhkQy",
                defaultMessage: "NO ID"
            }));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "TRRgnX",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": {
              "metadata": "Additional metadata content.",
              "text": "Something for the translator.",
            },
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "Something for the translator. Another description",
            "id": "NqjIBK",
          },
          {
            "defaultMessage": "NO ID",
            "description": "Something for the translator. Another description",
            "id": "XOhkQy",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("GH #2663_custom_transform", function () {
  if (!process.env.SWC_TRANSFORM_CUSTOM) {
    return;
  }
  expect(
    transformAndCheck("2663", undefined, {
      jsc: {
        target: "es5",
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
        try {
            var info = gen[key](arg);
            var value = info.value;
        } catch (error) {
            reject(error);
            return;
        }
        if (info.done) {
            resolve(value);
        } else {
            Promise.resolve(value).then(_next, _throw);
        }
    }
    function _asyncToGenerator(fn) {
        return function() {
            var self = this, args = arguments;
            return new Promise(function(resolve, reject) {
                var gen = fn.apply(self, args);
                function _next(value) {
                    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
                }
                function _throw(err) {
                    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
                }
                _next(undefined);
            });
        };
    }
    var __generator = this && this.__generator || function(thisArg, body) {
        var f, y, t, g, _ = {
            label: 0,
            sent: function() {
                if (t[0] & 1) throw t[1];
                return t[1];
            },
            trys: [],
            ops: []
        };
        return g = {
            next: verb(0),
            "throw": verb(1),
            "return": verb(2)
        }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
        }), g;
        function verb(n) {
            return function(v) {
                return step([
                    n,
                    v
                ]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while(_)try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [
                    op[0] & 2,
                    t.value
                ];
                switch(op[0]){
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return {
                            value: op[1],
                            done: false
                        };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [
                            0
                        ];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2]) _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            } catch (e) {
                op = [
                    6,
                    e
                ];
                y = 0;
            } finally{
                f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
                value: op[0] ? op[1] : void 0,
                done: true
            };
        }
    };
    function error1() {
        return _error1.apply(this, arguments);
    }
    function _error1() {
        _error1 = _asyncToGenerator(function() {
            return __generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        return [
                            4,
                            intl.formatMessage({
                                id: "dI+HS6",
                                defaultMessage: "foo"
                            })
                        ];
                    case 1:
                        _state.sent();
                        return [
                            2
                        ];
                }
            });
        }",
      "data": {
        "messages": [
          {
            "defaultMessage": "foo",
            "description": "foo",
            "id": "dI+HS6",
          },
        ],
        "meta": {},
      },
    }
  `);
});

test("GH #2663_plugin", function () {
  if (process.env.SWC_TRANSFORM_CUSTOM) {
    return;
  }
  expect(
    transformAndCheck("2663", undefined, {
      jsc: {
        target: "es5",
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
        try {
            var info = gen[key](arg);
            var value = info.value;
        } catch (error) {
            reject(error);
            return;
        }
        if (info.done) {
            resolve(value);
        } else {
            Promise.resolve(value).then(_next, _throw);
        }
    }
    function _asyncToGenerator(fn) {
        return function() {
            var self = this, args = arguments;
            return new Promise(function(resolve, reject) {
                var gen = fn.apply(self, args);
                function _next(value) {
                    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
                }
                function _throw(err) {
                    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
                }
                _next(undefined);
            });
        };
    }
    var __generator = this && this.__generator || function(thisArg, body) {
        var f, y, t, g, _ = {
            label: 0,
            sent: function() {
                if (t[0] & 1) throw t[1];
                return t[1];
            },
            trys: [],
            ops: []
        };
        return g = {
            next: verb(0),
            "throw": verb(1),
            "return": verb(2)
        }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
        }), g;
        function verb(n) {
            return function(v) {
                return step([
                    n,
                    v
                ]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while(_)try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [
                    op[0] & 2,
                    t.value
                ];
                switch(op[0]){
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return {
                            value: op[1],
                            done: false
                        };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [
                            0
                        ];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2]) _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            } catch (e) {
                op = [
                    6,
                    e
                ];
                y = 0;
            } finally{
                f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
                value: op[0] ? op[1] : void 0,
                done: true
            };
        }
    };
    function error1() {
        return _error1.apply(this, arguments);
    }
    function _error1() {
        _error1 = _asyncToGenerator(function() {
            var _tmp;
            return __generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        _tmp = {};
                        return [
                            4,
                            intl.formatMessage((_tmp.id = "dI+HS6", _tmp.defaultMessage = "foo", _tmp))
                        ];
                    case 1:
                        _state.sent();
                        return [
                            2
                        ];
                }
            });
        }",
      "data": {
        "messages": [
          {
            "defaultMessage": "foo",
            "description": "foo",
            "id": "dI+HS6",
          },
        ],
        "meta": {},
      },
    }
  `);
});

// UNSUPPORTED
test.skip("overrideIdFn", function () {
  transformAndCheck("overrideIdFn", {
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = path.basename(filePath!);
      return `${filename}.${id}.${
        defaultMessage!.length
      }.${typeof description}`;
    },
  });
});

test("removeDefaultMessage", function () {
  expect(
    transformAndCheck("removeDefaultMessage", {
      removeDefaultMessage: true,
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { defineMessages, FormattedMessage } from 'react-intl';
    defineMessages({
        foo: {
            id: 'greeting-user'
        },
        foo2: {
            id: "xoMBqZ"
        },
        foo3: {
            id: "s0FUZ6"
        }
    });
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "greeting-world"
            }), /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "mdcDCs"
            }), /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "xjsqOM"
            }));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello, {name}",
            "description": "Greeting the user",
            "id": "greeting-user",
          },
          {
            "defaultMessage": "foo2-msg",
            "description": "foo2",
            "id": "xoMBqZ",
          },
          {
            "defaultMessage": "foo3-msg",
            "id": "s0FUZ6",
          },
          {
            "defaultMessage": "Hello World!",
            "description": "Greeting to the world",
            "id": "greeting-world",
          },
          {
            "defaultMessage": "message with desc",
            "description": "desc with desc",
            "id": "mdcDCs",
          },
          {
            "defaultMessage": "message only",
            "id": "xjsqOM",
          },
        ],
        "meta": {},
      },
    }
  `);
});

// UNSUPPORTED
test.skip("removeDefaultMessage + overrideIdFn", function () {
  transformAndCheck("removeDefaultMessage", {
    removeDefaultMessage: true,
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = path.basename(filePath!);
      return `${filename}.${id}.${
        defaultMessage!.length
      }.${typeof description}`;
    },
  });
});

test("preserveWhitespace", function () {
  expect(
    transformAndCheck("preserveWhitespace", {
      preserveWhitespace: true,
    })
  ).toMatchInlineSnapshot(`
    {
      "code": "// @react-intl project:amazing
    function _extends() {
        _extends = Object.assign || function(target) {
            for(var i = 1; i < arguments.length; i++){
                var source = arguments[i];
                for(var key in source){
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        return _extends.apply(this, arguments);
    }
    import React, { Component } from 'react';
    import { defineMessages, FormattedMessage } from 'react-intl';
    const msgs = defineMessages({
        header: {
            id: 'foo.bar.baz',
            defaultMessage: "Hello World!"
        },
        content: {
            id: 'foo.bar.biff',
            defaultMessage: "Hello Nurse!"
        },
        kittens: {
            id: 'app.home.kittens',
            defaultMessage: "{count, plural, =0 {😭} one {# kitten} other {# kittens}}"
        },
        trailingWhitespace: {
            id: 'trailing.ws',
            defaultMessage: "   Some whitespace   "
        },
        escaped: {
            id: 'escaped.apostrophe',
            defaultMessage: "A quoted value ''{value}'"
        },
        newline: {
            id: 'newline',
            defaultMessage: "this is     a message"
        },
        linebreak: {
            id: 'linebreak',
            defaultMessage: "this is\\na message"
        },
        templateLinebreak: {
            id: 'templateLinebreak',
            description: \`this is
        a
        description\`,
            defaultMessage: "this is\\n    a message"
        }
    });
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("h1", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.header))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.content))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, _extends({}, msgs.kittens))), /*#__PURE__*/ React.createElement("p", null, /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "inline.linebreak",
                defaultMessage: "formatted message with linebreak"
            })));
        }
    }",
      "data": {
        "messages": [
          {
            "defaultMessage": "Hello World!",
            "description": "The default message",
            "id": "foo.bar.baz",
          },
          {
            "defaultMessage": "Hello Nurse!",
            "description": "Another message",
            "id": "foo.bar.biff",
          },
          {
            "defaultMessage": "{count, plural, =0 {😭} one {# kitten} other {# kittens}}",
            "description": "Counts kittens",
            "id": "app.home.kittens",
          },
          {
            "defaultMessage": "   Some whitespace   ",
            "description": "Whitespace",
            "id": "trailing.ws",
          },
          {
            "defaultMessage": "A quoted value ''{value}'",
            "description": "Escaped apostrophe",
            "id": "escaped.apostrophe",
          },
          {
            "defaultMessage": "this is     a message",
            "description": "this is     a     description",
            "id": "newline",
          },
          {
            "defaultMessage": "this is
    a message",
            "description": "this is
    a
    description",
            "id": "linebreak",
          },
          {
            "defaultMessage": "this is
        a message",
            "id": "templateLinebreak",
          },
          {
            "defaultMessage": "formatted message
    						with linebreak",
            "description": "foo
    						bar",
            "id": "inline.linebreak",
          },
        ],
        "meta": {
          "project": "amazing",
        },
      },
    }
  `);
});

test("extractSourceLocation", function () {
  const { data, code } = transformAndCheck("extractSourceLocation", {
    extractSourceLocation: true,
  });

  expect(code).toMatchInlineSnapshot(`
    "import React, { Component } from 'react';
    import { FormattedMessage } from 'react-intl';
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: "foo.bar.baz",
                defaultMessage: "Hello World!"
            });
        }
    }"
  `);

  const dataSnapshot = `
  [
    {
      "defaultMessage": "Hello World!",
      "id": "foo.bar.baz",
      "loc": {
        "end": {
          "col": 78,
          "line": 6,
        },
        "file": "${getFixturePath("extractSourceLocation.js")}",
        "start": {
          "col": 11,
          "line": 6,
        },
      },
    },
  ]
`;
  expect(data.messages).toMatchInlineSnapshot(dataSnapshot);
  expect(data.meta).toMatchInlineSnapshot(`{}`);
  /*
  const filePath = path.join(__dirname, "fixtures", "extractSourceLocation.js");
  const messages: ExtractedMessageDescriptor[] = [];
  const meta = {};

  const { code } = transform(filePath, undefined, {
    pragma: "@react-intl",
    extractSourceLocation: true,
  });
  expect(code?.trim()).toMatchSnapshot();
  expect(messages).toMatchSnapshot([
    {
      file: expect.any(String),
    },
  ]);
  expect(meta).toMatchSnapshot();*/
});

test("Properly throws parse errors", () => {
  expect(() =>
    transform(path.join(__dirname, "fixtures", "icuSyntax.js"))
  ).toThrow("SyntaxError: MALFORMED_ARGUMENT");
});

test("skipExtractionFormattedMessage", function () {
  expect(transformAndCheck("skipExtractionFormattedMessage"))
    .toMatchInlineSnapshot(`
    {
      "code": "import React, { Component } from 'react';
    import { FormattedMessage } from 'react-intl';
    function nonStaticId() {
        return 'baz';
    }
    export default class Foo extends Component {
        render() {
            return /*#__PURE__*/ React.createElement(FormattedMessage, {
                id: \`foo.bar.\${nonStaticId()}\`
            });
        }
    }",
      "data": {
        "messages": [],
        "meta": {},
      },
    }
  `);
});
