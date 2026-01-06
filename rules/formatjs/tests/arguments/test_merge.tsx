import { FormattedMessage } from "react-intl";

export function MergeTestComponent() {
  return (
    <div>
      <FormattedMessage
        id="merge.first"
        defaultMessage="First message from merge test"
        description="First test message"
      />
      <FormattedMessage
        id="merge.second"
        defaultMessage="Second message from merge test"
        description="Second test message"
      />
    </div>
  );
}
