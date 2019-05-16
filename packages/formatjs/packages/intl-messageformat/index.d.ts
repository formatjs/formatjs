type LocaleData = {
    locale: string;
    [key: string]: any;
};

declare class IntlMessageFormat {
    constructor(message: string, locales: string | string[], formats?: any);
    format(context?: any): string;

    static defaultLocale: string;
    static __localeData__: LocaleData;
    static __addLocaleData: (localeData: LocaleData | LocaleData[]) => void;
}

export default IntlMessageFormat;
