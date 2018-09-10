import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { intlShape, injectIntl } from 'react-intl';

import './App.css';
import { selectedLocale } from './actions/index';

class App extends Component {
  render() {
    const { intl, selectedLocale } = this.props;
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome to rect-intl with redux</h2>
        </div>
        <p className="App-intro">
          Select the language
        </p>
        <ul className="language">
          <li
            onClick={() => selectedLocale('en')}
            className='english'
          >
            English
          </li>
          <li
            onClick={() => selectedLocale('es')}
            className='spanish'
          >
            Spanish
          </li>
          <li
            onClick={() => selectedLocale('fr')}
            className='french'
          >
            French
          </li>
        </ul>
        <p className="notice">
          See the changes below
        </p>
        <p className="translated-message">
          {intl.formatMessage({ id: 'app.translatedMessage' })}
        </p>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectedLocale }, dispatch);
}


App.propTypes = {
  intl: intlShape.isRequired
};

export default injectIntl(connect(null, mapDispatchToProps)(App));
