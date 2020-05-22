export interface UnicodeLocaleId {
  lang: UnicodeLanguageId;
  extensions: Array<
    UnicodeExtension | TransformedExtension | PuExtension | OtherExtension
  >;
}

export interface UnicodeLanguageId {
  lang: string;
  script?: string;
  region?: string;
  variants: string[];
}

export type KV = [string, string] | [string];

export interface Extension {
  type: string;
}

export interface UnicodeExtension extends Extension {
  type: 'u';
  keywords: KV[];
  attributes: string[];
}

export interface TransformedExtension extends Extension {
  type: 't';
  fields: KV[];
  lang?: UnicodeLanguageId;
}
export interface PuExtension extends Extension {
  type: 'x';
  value: string;
}

export interface OtherExtension extends Extension {
  type:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 'v'
    | 'w'
    | 'y'
    | 'z';
  value: string;
}
