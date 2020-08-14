---
id: distribute-libraries
title: Distributing i18n-friendly libraries
---

In larger scale applications/monorepos, not all components/libraries live within the same repo/project and they might get distributed differently. While there are multiple ways to solve this problem, this guide aims to provide a guidance that we've seen working quite well with large engineering orgs.

## High level concept

Translated strings are basically assets, just like CSS, static configuration or images. The high level structure typically contains several layers:

- Reusable Components/Libraries that have translated strings, which can be nested.
- Consuming higher-level applications that consumes those components/libraries.

![Distribution Hierarchy](/img/distribute-libs.svg)

Each feature/library would be in charge of:

- [Declaring its messages](../getting-started/message-declaration.md).
- Integrating with the [translation pipeline](../getting-started/application-workflow.md).
- Declaring its translated & aggregated strings using either a [manifest like package.json](https://docs.npmjs.com/files/package.json) or a convention (always output to a specific location) or both.

## Declaring in package.json

This is similar to using `style` attribute to declare CSS. You can declare something like

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "lang": "my-strings",
  "supportedLocales": ["en", "en-GB", "ja"]
}
```

where `my-strings` is the folder containing your translated strings in your `supportedLocales`:

```
my-strings
|- en.json
|- en-GB.json
|- ja.json
```

Consuming application can walk through `node_modules` looking for `package.json` files with these fields and aggregate the strings together into a single bundle (or multiple bundles) and serve those JSON however it chooses to.

This provides flexibility to output translations to any location you want as long as it's declared in `package.json`. However, this also incurs additional processing cost at the application level and also encourages inconsistency in output location.

## Declaring with a convention

This is similar to [Declaring in package.json](#declaring-in-packagejson), except translation is always output to `lang/{locale}.json`. Upstream application can do

```sh
formatjs compile "node_modules/**/lang/en.json" --ast --out-file lang/en.json
```

to aggregate all its libraries' pre-translated strings.

```
my-lib
|- src
|- lang
    |- en.json
    |- en-GB.json
    |- ja.json
|- node_modules
    |- library1
        |- lang
            |- en.json
            |- en-GB.json
            |- ja.json
    |- library2
        |- lang
            |- en.json
            |- en-GB.json
            |- ja.json
```

This provides consistency and minimize processing cost of different manifest files but also is less flexible.

:::info We've seen `convention` approach working better in large engineering org due to enforcement of convention & structure while `manifest` approach working in a more open environment. :::

## Passing down `intl` object

The core of a i18n application is the `intl` object, which contains precompiled messages, locale settings, format settings and cache. Therefore, this should only be initialized at the top level in the application.

Component libraries can declare `intl: IntlShape` as a prop and subsequently pass it down directly like:

```tsx
import {IntlShape} from 'react-intl';
import {MyButton, MyForm} from 'my-components';
interface Props {
  intl: IntlShape;
}

function MyFeature(props: Props) {
  return (
    <div>
      <MyButton intl={props.intl} />
      <MyForm intl={props.intl} />
    </div>
  );
}
```

or passing down via `context` using `RawIntlProvider`:

```tsx
import {IntlShape, RawIntlProvider} from 'react-intl';
import {MyButton, MyForm} from 'my-components';
interface Props {
  intl: IntlShape;
}

function MyFeature(props: Props) {
  return (
    <RawIntlProvider value={intl}>
      <MyButton />
      <MyForm />
    </RawIntlProvider>
  );
}
```
