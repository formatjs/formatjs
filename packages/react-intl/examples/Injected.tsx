import * as React from 'react';
import {IntlProvider, useIntl, injectIntl, IntlShape} from '../';

const Comp: React.FC<{}> = _ => {
  const {formatDate} = useIntl();
  return <h1>{formatDate(Date.now())}</h1>;
};

const Comp2: React.FC<{intl: IntlShape}> = ({
  intl: {formatDate, formatTime},
}) => {
  return (
    <>
      <h1>{formatDate(new Date(), {month: 'long'})}</h1>
      <h2>{formatTime(undefined)}</h2>
    </>
  );
};

const Comp2WithIntl = injectIntl(Comp2);

interface Props {
  currentTime?: Date | number;
}

const App: React.FC<Props> = _ => {
  return (
    <IntlProvider locale="en" timeZone="Asia/Tokyo">
      <div>
        <Comp />
        <Comp2WithIntl />
      </div>
    </IntlProvider>
  );
};

App.defaultProps = {
  currentTime: new Date(),
};

export default App;
