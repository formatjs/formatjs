import * as React from 'react';
import {FormattedDate, FormattedTime, IntlProvider} from '../';

interface Props {
  currentTime?: Date | number;
}

const App: React.FC<Props> = ({currentTime = Date.now()}) => {
  return (
    <IntlProvider locale="en" timeZone="Asia/Tokyo">
      <p>
        The date in Tokyo is: <FormattedDate value={currentTime} />
        <br />
        The time in Tokyo is: <FormattedTime value={currentTime} />
        <br />
        <FormattedDate value={currentTime} shouldFormatToParts>
          {parts => <>{JSON.stringify(parts)}</>}
        </FormattedDate>
      </p>
    </IntlProvider>
  );
};

App.defaultProps = {
  currentTime: new Date(),
};

export default App;
