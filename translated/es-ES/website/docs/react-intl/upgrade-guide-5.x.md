---
id: upgrade-guide-5x
title: Upgrade Guide (v4 -> v5)
---

## Breaking API Changes

- Rich text formatting callback function is no longer variadic.

Before:

```tsx
new IntlMessageFormat('a<b>strong</b>').format({
  b: (...chunks) => <strong>{chunks}</strong>,
});
```

After:

```tsx
new IntlMessageFormat('a<b>strong</b>').format({
  b: chunks => <strong>{chunks}</strong>,
});
```

- `FormattedMessage` render prop is no longer variadic.

Before:

```tsx
<FormattedMessage defaultMessage="a<b>strong</b>">
  {(...chunks) => <b>{chunks}</b>}
</FormattedMessage>
```

After:

```tsx
<FormattedMessage defaultMessage="a<b>strong</b>">
  {chunks => <b>{chunks}</b>}
</FormattedMessage>
```

- Using `FormattedMessage` without a `intl` context will fail fast.

## Why are we doing those changes?

### Rich text formatting callback function is no longer variadic

- We received feedback from the community that variadic callback function isn't really ergonomic.
- There's also an issue where React `chunks` do not come with keys, thus causing warning in React during development.
- The `chunks` by themselves are not enough to render duplicate tags, such as `<a>link</a> and another <a>link</a>` where you want to render 2 different `href`s for the `<a>` tag. In this case `a: chunks => <a>{chunks}</a>` isn't enough especially when the contents are the same. In the future we can set another argument that might contain metadata to distinguish between the 2 elements.

### `FormattedMessage` render prop is no longer variadic

- Same reasons as above.

### Using `FormattedMessage` without a `intl` context will fail fast

- This also comes from Dropbox internal developer feedback. `FormattedMessage` has a default English renderer that masks `Provider` setup issues which causes them to not be handled during testing phase.
