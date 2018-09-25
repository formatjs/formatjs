import React from 'react'
import {shallow} from 'enzyme';

export const mockIntlContext = (intl) => {
  jest.doMock(
    '../../src/components/withIntlContext',
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
}

export const shallowDeep = (componentInstance, depth, options) => {
  let rendered = shallow(componentInstance, options)

  for (let i = 1; i < depth; i++) {
    rendered = rendered.first().shallow()
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
