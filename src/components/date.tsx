/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import createFormattedComponent from './createFormattedComponent';

const {BaseComponent: _BaseComponent, Component} = createFormattedComponent(
  'formatDate'
);

export const BaseComponent = _BaseComponent;
export default Component;
