import { FormattedMessage, useIntl } from "react-intl";

export function App() {
  const intl = useIntl();

  return (
    <div>
      <h1>
        <FormattedMessage
          id="app.title"
          defaultMessage="Welcome to FormatJS"
          description="Main application title"
        />
      </h1>
      <p>
        <FormattedMessage
          id="app.description"
          defaultMessage="This is an example of internationalized React app using FormatJS and Bazel."
          description="Application description"
        />
      </p>
      <button
        onClick={() => alert(intl.formatMessage({ id: "app.button", defaultMessage: "Click me!" }))}
      >
        <FormattedMessage id="app.button" defaultMessage="Click me!" description="Button text" />
      </button>
    </div>
  );
}
