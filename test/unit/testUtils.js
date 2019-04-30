import React from 'react'
import {shallow} from 'enzyme';

export const makeMockContext = (modulePath, exportName = 'default') => (intl = null) => {
  jest.resetModules();
  jest.doMock(
    '../../src/components/withIntl',
    () => ({
      __esModule: true,
      default: (WrappedComponent) => {
        return class extends React.Component {
          constructor (props) {
            super(props)

            this.state = {
              intl: false
            }
          }

          mockContext (intl) {
            this.setState({ intl });
          }

          render () {
            return (
              <WrappedComponent
                {...this.props}
                intl={this.state.intl || intl}
              />
            )
          }
        }
      },
      Provider: ({ children, value }) => React.cloneElement(
        React.Children.only(children),
        { intl: value }
      )
    })
  )

  return require(modulePath)[exportName]
}

export const shallowDeep = (componentInstance, depth, options) => {
  let rendered = shallow(componentInstance, options);

  for (let i = 1; i < depth; i++) {
    rendered = rendered.dive();
  }

  return rendered
}

export class SpyComponent extends React.Component {
  constructor (props) {
    super(props)

    this._renders = 0;
  }

  getRenderCount () {
    return this._renders;
  }

  render () {
    this._renders++;

    return null
  }
}

const mockProviderContext = makeMockContext('../../src/components/provider');
export const generateIntlContext = (intl) => {
  const IntlProvider = mockProviderContext();

  return shallowDeep(
    <IntlProvider {...intl}>
      <div />
    </IntlProvider>,
    2
  ).first().prop('value');
}
