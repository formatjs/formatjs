import React, {Component} from 'react';
import * as PropTypes from 'prop-types';
import {FormattedDate, FormattedTime} from 'react-intl';

class App extends Component {
  render() {
    const {currentTime} = this.props;

    return (
      <p>
        The date in Tokyo is: <FormattedDate value={currentTime} />
        <br />
        The time in Tokyo is: <FormattedTime value={currentTime} />
      </p>
    );
  }
}

App.propTypes = {
  currentTime: PropTypes.object,
};

App.defaultProps = {
  currentTime: new Date(),
};

export default App;
