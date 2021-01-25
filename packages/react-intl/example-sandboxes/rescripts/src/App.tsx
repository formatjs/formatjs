import './styles.css';
import {IntlProvider, FormattedMessage} from 'react-intl';
export default function App() {
  return (
    <IntlProvider locale="en" messages={{}}>
      <div className="App">
        <h1>
          <FormattedMessage defaultMessage="Hello CodeSandbox" />
        </h1>
        <h2>
          <FormattedMessage defaultMessage="Start editing to see some magic happen!" />
        </h2>
      </div>
    </IntlProvider>
  );
}
