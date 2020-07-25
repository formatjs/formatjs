---
id: message-extraction
title: Message Extraction
---

Now that you've declared some messages, it's time to extract them.

## Installation

```sh
npm i -D @formatjs/cli
```

## Extraction

```sh
formatjs extract "src/**/*.ts*" --out-file lang/en.json
```

Given a file that has the following messages:

```tsx
import * as React from 'react';
import {FormattedMessage, useIntl, injectIntl} from 'react-intl';

class PasswordChangeWithIntl extends React.Component {
  render() {
    const {intl} = this.props;
    return (
      <li>
        <input
          placeholder={intl.formatMessage({
            defaultMessage: 'New Password',
            description: 'placeholder text',
          })}
        />
        <input
          placeholder={intl.formatMessage({
            id: 'explicit-id',
            defaultMessage: 'Confirm Password',
            description: 'placeholder text',
          })}
        />
      </li>
    );
  }
}

const PasswordChange = injectIntl(PasswordChangeWithIntl);

export function List(props) {
  const intl = useIntl();
  return (
    <section>
      <header>
        <FormattedMessage
          defaultMessage="Control Panel"
          description="title of control panel section"
        />
      </header>
      <ul>
        <li>
          <button>
            <FormattedMessage
              defaultMessage="Delete user {name}"
              description="Delete button"
              values={{
                name: props.name,
              }}
            />
          </button>
        </li>
        <PasswordChange />
      </ul>
    </section>
  );
}
```

running the above command will create a file called `lang/en.json`:

```json
{
  "hak27d": {
    "defaultMessage": "Control Panel",
    "description": "title of control panel section"
  },
  "haqsd": {
    "defaultMessage": "Delete user {name}",
    "description": "delete button"
  },
  "19hjs": {
    "defaultMessage": "New Password",
    "description": "placeholder text"
  },
  "explicit-id": {
    "defaultMessage": "Confirm Password",
    "description": "placeholder text"
  }
}
```

:::info File Format
The format of this file is meant to be verbose for translation purposes, not for direct consumption of `react-intl`.
:::

:::info Message ID
During extraction, we'll preserve explicit declared IDs and insert a hash as an ID for messages without. We recommend against explicit IDs since it can cause collision.
:::
