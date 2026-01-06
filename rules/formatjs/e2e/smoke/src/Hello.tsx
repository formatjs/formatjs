import { FormattedMessage } from "react-intl";

export function Hello() {
  return (
    <div>
      <FormattedMessage
        id="hello.world"
        defaultMessage="Hello, World!"
        description="Simple greeting message"
      />
    </div>
  );
}
