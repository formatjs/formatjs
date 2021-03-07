/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {declare} from '@babel/helper-plugin-utils';
import {PluginObj, PluginPass} from '@babel/core';
import {validate} from 'schema-utils';
import * as OPTIONS_SCHEMA from './options.schema.json';
import {OptionsSchema} from './options';
import babelPluginSyntaxJsx from '@babel/plugin-syntax-jsx';
import {ExtractedMessageDescriptor, State} from './types';
import {visitor as JSXOpeningElement} from './visitors/jsx-opening-element';
import {visitor as CallExpression} from './visitors/call-expression';

export type ExtractionResult<M = Record<string, string>> = {
  messages: ExtractedMessageDescriptor[];
  meta: M;
};

export default declare<
  OptionsSchema,
  PluginObj<PluginPass<OptionsSchema> & State>
>((api, options) => {
  api.assertVersion(7);

  validate(OPTIONS_SCHEMA as any, options, {
    name: 'babel-plugin-formatjs',
    baseDataPath: 'options',
  });
  const {pragma} = options;

  return {
    inherits: babelPluginSyntaxJsx,
    pre() {
      if (!this.ReactIntlMessages) {
        this.ReactIntlMessages = new Map();
        this.ReactIntlMeta = {};
      }
    },

    post(state) {
      const {ReactIntlMessages: messages, ReactIntlMeta} = this;
      const descriptors = Array.from(messages.values());
      (state as any).metadata['formatjs'] = {
        messages: descriptors,
        meta: ReactIntlMeta,
      } as ExtractionResult;
    },

    visitor: {
      Program(path) {
        const {body} = path.node;
        const {ReactIntlMeta} = this;
        if (!pragma) {
          return;
        }
        for (const {leadingComments} of body) {
          if (!leadingComments) {
            continue;
          }
          const pragmaLineNode = leadingComments.find(c =>
            c.value.includes(pragma)
          );
          if (!pragmaLineNode) {
            continue;
          }

          pragmaLineNode.value
            .split(pragma)[1]
            .trim()
            .split(/\s+/g)
            .forEach(kv => {
              const [k, v] = kv.split(':');
              ReactIntlMeta[k] = v;
            });
        }
      },
      JSXOpeningElement,
      CallExpression,
    },
  };
});

export type {OptionsSchema} from './options';
