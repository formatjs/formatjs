const createTextFragment = (text) => ({ text });

const createPlaceholder = (name, content) => ({ name, content });

const isPlaceholder = (fragment) => (!!fragment.name);

const addFragment = (fragments, fragment) => {
    if (!isPlaceholder(fragment) && !fragment.text) {
        return fragments;
    }

    return fragments.concat(fragment);
};

/*
 * This method looks for '<x:tag>...</x:tag>'
 * Eg: My beautiful sentence with <x:link>a link</x:link>
 *
 * Note:
 * - self-closing tags are not supported
 * - nested tags with the same name are not supported
 */
const extract = (translation) => {
    const placeholder = '[A-Za-z0-9_]+';
    const re = new RegExp(`<x:(${placeholder})>(.*?)</x:\\1>`, 'g');
    let fragments = [];
    let startIndex = 0;

    let match;
    while ((match = re.exec(translation)) !== null) {
        const [fullMatch, tagName, content] = match;
        const matchingIndex = match.index;

        fragments = addFragment(fragments, createTextFragment(translation.substring(startIndex, matchingIndex)));
        fragments = addFragment(fragments, createPlaceholder(tagName, extract(content)));

        startIndex = matchingIndex + fullMatch.length;
    }
    fragments = addFragment(fragments, createTextFragment(translation.substring(startIndex)));

    return fragments;
};

export const replacePlaceholders = (translation, placeholders = {}) => {
    const fragments = extract(translation);
    let keyIndex = 0;

    const replace = (fragment) => {
        if (fragment.name) {
            const placeholder = placeholders[fragment.name];
            if (placeholder) {
                if (typeof placeholder === 'function') {
                    keyIndex++;
                    const children = fragment.content.map(replace);
                    return placeholder(children, `placeholder-${keyIndex}`);
                }
                return placeholder;
            }

            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[React Intl] No placeholder named: ${fragment.name}`
                );
            }

            return null;
        }

        return fragment.text;
    };

    return fragments.map(replace);
};
