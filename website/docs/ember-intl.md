---
id: ember-intl
title: Overview
---

`ember-intl` helps you internationalize your Ember projects. It supports TypeScript and [Glint](https://typed-ember.gitbook.io/glint/) (type-check for templates).

## Installation

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs
groupId="installation"
defaultValue="pnpm"
values={[
{label: 'pnpm', value: 'pnpm'},
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="pnpm">

```sh
pnpm add ember-intl
```

</TabItem>

<TabItem value="npm">

```sh
npm install ember-intl
```

</TabItem>

<TabItem value="yarn">

```sh
yarn add ember-intl
```

</TabItem>
</Tabs>

For more information, see [Quickstart](https://ember-intl.github.io/ember-intl/docs/quickstart).

## Usage

The complete documentation is available on the [`ember-intl` website](https://ember-intl.github.io/ember-intl/). For brevity, this section covers the most important features.

### Helpers

`ember-intl` provides several locale-aware helpers, so that you can display translations, numbers, dates, etc.

The helper that you will most frequently use is `{{t}}` (the "t helper" or "translation helper"). In a template (an `*.hbs` file), you can render a translation like this:

```hbs
{{! app/components/hello.hbs }}
<div data-test-message>
  {{t 'hello.message' name=@name}}
</div>
```

In a `<template>`-tag component (`*.{gjs,gts}`), use the named import to consume the `{{t}}` helper.

```ts
/* app/components/hello.gts */
import { t } from 'ember-intl';

<template>
  <div data-test-message>
    {{t "hello.message" name=@name}}
  </div>
</template>
```

### Services

`ember-intl` provides 1 locale-aware service: `intl`. This service allows you to use `ember-intl`'s API in _any_ class (components, routes, and even native JS classes).

```ts
/* app/components/example.ts */
import {service} from '@ember/service'
import Component from '@glimmer/component'
import type {IntlService} from 'ember-intl'

export default class ExampleComponent extends Component {
  @service declare intl: IntlService

  get options(): string[] {
    return [
      this.intl.t('components.example.option-1'),
      this.intl.t('components.example.option-2'),
      this.intl.t('components.example.option-3'),
    ]
  }
}
```

### Test Helpers

`ember-intl` provides a few test helpers, so that you can check locale-dependent code (e.g. component and route templates) under various conditions.

```ts
/* tests/integration/components/hello.gts */
import Hello from '#app/components/hello';
import { render } from '@ember/test-helpers';
import { setupIntl } from 'ember-intl/test-support';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Integration | Component | hello', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'de-de');

  test('it renders', async function (assert) {
    await render(
      <template>
        <Hello @name="Zoey" />
      </template>
    );

    assert.dom('[data-test-message]').hasText('Hallo, Zoey!');
  });
});
```

Note, the test (this also means you, the developer) sees exactly the text that the user will see.
