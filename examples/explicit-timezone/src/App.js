import React from 'react';
import {FormattedDate, FormattedTime} from 'react-intl';

export default props => <p>
  The date in Tokyo is: <FormattedDate value={props.currentTime} />
  <br />
  The time in Tokyo is: <FormattedTime value={props.currentTime} />
</p>;


export default App;
