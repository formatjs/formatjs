---
id: basic-internationalization-principles
title: Basic Internationalization Principles
---

## What Is Internationalization and Why Does It Matter?

Internationalized software supports the languages and cultural customs of people throughout the world. The Web reaches all parts of the world. Internationalized web apps provide a great user experience for people everywhere.

Localized software adapts to a specific language and culture by translating text into the user's language and formatting data in accordance with the user's expectations. An app is typically localized for a small set of locales.

The [ECMA-402 JavaScript internationalization specification](https://github.com/tc39/ecma402) has an excellent overview.

## Locales: Language and Region

A "locale" refers to the lingual and cultural expectations for a region. It is represented using a "locale code" defined in (UTS LDML](https://www.unicode.org/reports/tr35/tr35.html#Identifiers).

This code is comprised of several parts separated by hyphens (-). The first part is a short string representing the language. The second, optional, part is a short string representing the region. Additionally, various extensions and variants can be specified.

Typically, web apps are localized to just the language or language-region combination. Examples of such locale codes are:

- `en` for English
- `en-US` for English as spoken in the United States
- `en-GB` for English as spoken in the United Kingdom
- `es-AR` for Spanish as spoken in Argentina
- `ar-001` for Arabic as spoken throughout the world
- `ar-AE` for Arabic as spoken in United Arab Emirates

Most internationalized apps only support a small list of locales.

## Translating Strings

You likely have some text in your application that is in a natural language such as English or Japanese. In order to support other locales, you will need to translate these strings.

FormatJS provides a mechanism to let you write the core "software" of your application without special code for different translations. The considerations for each locale are encapsulated in your translated strings and our libraries.

```tsx
const messages = {
  en: {
    GREETING: 'Hello {name}',
  },
  fr: {
    GREETING: 'Bonjour {name}',
  },
};
```

We use the [ICU Message syntax](http://userguide.icu-project.org/formatparse/messages) which is also used in [Java](http://docs.oracle.com/javase/7/docs/api/java/text/MessageFormat.html), C, PHP and various other platforms.

## Bundling Translated Strings

It is common to organize your translations primarily by locale, because you only need the translations for the user's current locale. Our template and component library integrations are designed to work with the translations for a single locale. If your app is complex, you can further subdivide your translations, such as by page or section of the site.

## Structure of Code

The actual formatting and presentation of data and translated strings typically takes these steps:

1. Determine the user's locale, as described in Runtime Environments guide.
2. Setup one of FormatJS's integrations with the following data:
   - the user's current locale
   - translated strings for that locale
   - optionally, any custom formats
3. Call the template engine, passing the data that needs formatting.
