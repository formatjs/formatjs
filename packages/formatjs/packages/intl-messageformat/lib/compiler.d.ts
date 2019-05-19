import { MessageFormatPattern, MessageTextElement, ArgumentElement } from 'intl-messageformat-parser';
export interface Formats {
    number: Record<string, Intl.NumberFormatOptions>;
    date: Record<string, Intl.DateTimeFormatOptions>;
    time: Record<string, Intl.DateTimeFormatOptions>;
}
export declare type Pattern = string | PluralOffsetString | PluralFormat | SelectFormat | StringFormat;
export default class Compiler {
    private locales;
    private formats;
    private pluralNumberFormat;
    private currentPlural;
    private pluralStack;
    constructor(locales: string | string[], formats: Formats);
    compile(ast: MessageFormatPattern): Pattern[];
    compileMessage(ast: MessageFormatPattern): Pattern[];
    compileMessageText(element: MessageTextElement): string | PluralOffsetString;
    compileArgument(element: ArgumentElement): PluralFormat | SelectFormat | StringFormat;
    compileOptions(element: ArgumentElement): {};
}
declare abstract class Formatter {
    id: string;
    constructor(id: string);
    abstract format(value: string | number): string;
}
export declare class StringFormat extends Formatter {
    format(value: number | string): string;
}
export declare class PluralFormat {
    id: string;
    private offset;
    private options;
    private pluralRules;
    constructor(id: string, useOrdinal: boolean, offset: number, options: Record<string, Pattern[]>, locales: string | string[]);
    getOption(value: number): Pattern[];
}
export declare class PluralOffsetString extends Formatter {
    private offset;
    private numberFormat;
    private string;
    constructor(id: string, offset: number, numberFormat: Intl.NumberFormat, string: string);
    format(value: number): string;
}
export declare class SelectFormat {
    id: string;
    private options;
    constructor(id: string, options: Record<string, Pattern[]>);
    getOption(value: string): Pattern[];
}
export declare function isSelectOrPluralFormat(f: any): f is SelectFormat | PluralFormat;
export {};
