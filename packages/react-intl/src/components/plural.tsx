/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl, {WithIntlProps} from './injectIntl';
import {IntlShape, FormatPluralOptions} from '../types';

interface Props extends FormatPluralOptions {
  value: number;
  intl: IntlShape;
  other: React.ReactNode;
  zero?: React.ReactNode;
  one?: React.ReactNode;
  two?: React.ReactNode;
  few?: React.ReactNode;
  many?: React.ReactNode;
  children?(value: React.ReactNode): React.ReactElement | null;
}

const FormattedPlural: React.FC<Props> = props => {
  const {
    value,
    other,
    children,
    intl: {formatPlural, textComponent: Text},
  } = props;

  const pluralCategory = formatPlural(value, props);
  const formattedPlural = props[pluralCategory as 'one'] || other;

  if (typeof children === 'function') {
    return children(formattedPlural);
  }
  if (Text) {
    return <Text>{formattedPlural}</Text>;
  }
  // Work around @types/react where React.FC cannot return string
  return formattedPlural as any;
};

FormattedPlural.defaultProps = {
  type: 'cardinal',
};

FormattedPlural.displayName = 'FormattedPlural';

// Explicitly annotate type here to workaround API extractor's inability to handle `import('./someModule')`
// type annotations when rolling up DTS file.
const FormattedPluralWithIntl: React.FC<WithIntlProps<Props>> & {
  WrappedComponent: React.ComponentType<Props>;
} = withIntl(FormattedPlural);

export default FormattedPluralWithIntl;
