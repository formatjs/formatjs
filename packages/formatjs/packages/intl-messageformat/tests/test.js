//// MESSAGE CREATION

var msg, m;


// Simple string formatter
msg = new MessageFormatter(null, 'My name is ${first} {last}.');

m = msg.format({
    first: 'Anthony',
    last: 'Pipkin'
});
// m === My name is Anthony Pipkin.




// Complex object formatter
msg = new MessageFormatter(null, ['Some text before ', {
    type: 'plural',
    valueName: 'numPeople',
    offset: 1,
    options: {
        one: 'Some message ${ph} with ${#} value',

        few: ['Optional prefix text for |few| ', {
            type: 'select',
            valueName: 'gender',
            options: {
                male: 'Text for male option with \' single quotes',
                female: 'Text for female option with {}',
                other: 'Text for default'
            }
        }, ' optional postfix text'],

        other: 'Some messages for the default',

            '1': ['Optional prefix text ', {
            type: 'select',
            valueName: 'gender',
            options: {
                male: 'Text for male option with \' single quotes',
                female: 'Text for female option with {}',
                other: 'Text for default'
            }
        }, ' optional postfix text'],
    }
}, ' and text after']);


m = msg.format({
    numPeople: 4,
    ph: 'whatever',
    gender: 'male'
});

// m === Some text before Optional prefix text for |few| Text for male option with ' single quotes optional postfix text and text after





// Simple string formatter using a custom formatter for a token
msg = new MessageFormatter(null, 'Test formatter d: ${num:d}', {
    d: function (locale, val) {
        return +val;
    }
});
m = msg.format({
    num: '010'
});

// m === Test formatter d: 10


