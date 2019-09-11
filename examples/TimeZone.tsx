import * as React from 'react';
import {
  FormattedDate,
  FormattedTime,
  IntlProvider,
  FormattedDateParts,
} from '../';

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
        <FormattedDateParts
          value={new Date(1459832991883)}
          year="numeric"
          month="long"
          day="2-digit"
        >
          {(parts: Intl.DateTimeFormatPart[]) => (
            <>
              <b>{parts[0].value}</b>
              {parts[1].value}
              <small>{parts[2].value}</small>
            </>
          )}
        </FormattedDateParts>
      </p>
    </IntlProvider>
  );
};

App.defaultProps = {
  currentTime: new Date(),
};

export default App;
