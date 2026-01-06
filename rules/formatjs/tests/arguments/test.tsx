import { FormattedMessage } from "react-intl";

export function TestComponent() {
  return (
    <div>
      <FormattedMessage
        id="test.message"
        defaultMessage="This is a test message"
        description="A simple test message"
      />
      <FormattedMessage
        id="test.whitespace"
        defaultMessage="This    has     multiple     spaces"
        description="Testing whitespace preservation"
      />
    </div>
  );
}
