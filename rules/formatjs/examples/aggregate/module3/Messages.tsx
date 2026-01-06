import { FormattedMessage } from "react-intl";

export function Module3Messages() {
  return (
    <>
      <FormattedMessage
        id="module3.title"
        defaultMessage="Module 3 Title"
        description="Title for module 3"
      />
      <FormattedMessage
        id="module3.description"
        defaultMessage="This is the third module"
        description="Description for module 3"
      />
      <FormattedMessage id="common.save" defaultMessage="Save" description="Common save button" />
      <FormattedMessage
        id="common.cancel"
        defaultMessage="Cancel"
        description="Common cancel button"
      />
    </>
  );
}
