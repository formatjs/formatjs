import {parse} from 'intl-messageformat-parser';
import print from './printer';

export default class Translator {
    constructor(translateText) {
        this.translateText = translateText;
    }

    translate(message) {
        let ast        = parse(message);
        let translated = this.transform(ast);
        return print(translated);
    }

    transform(ast) {
        ast.elements.forEach((el) => {
            if (el.type === 'messageTextElement') {
                el.value = this.translateText(el.value);
            } else {
                let options = el.format && el.format.options;
                if (options) {
                    options.forEach((option) => this.transform(option.value));
                }
            }
        });

        return ast;
    }
}
