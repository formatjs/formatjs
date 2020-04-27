export type Locale = string;
export interface LocaleData<T> {
  data: Record<Locale, T>;
  aliases: Record<string, string>;
  availableLocales: string[];
  parentLocales: Record<string, string>;
}
