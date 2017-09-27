import React, {Component} from 'react';
import {FormattedMessage, FormattedHTMLMessage} from 'react-intl';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            totalApplicationsPlural: 2,
            totalApplicationsSingular: 1,
            totalApplicationsEmpty: 0,
            totalAttacksPlural: 2,
            totalAttacksSingular: 1,
            attackEventName: "mAttack",
            attackEventSource: "mAttackSource",
            logEnhancer: "mLogEnhancer",
            availableLicenses: 3,
            totalLicenses: 10

        };
    }

    render() {
        const {totalApplicationsPlural, totalApplicationsSingular, totalApplicationsEmpty,
               totalAttacksPlural, totalAttacksSingular,
               attackEventName, attackEventSource,
               logEnhancer,
               availableLicenses, totalLicenses } = this.state;

        return (

        <div>
            <p>
                <FormattedMessage
                    id="simpleString"
                    defaultMessage={`Simple String`}
                />
            </p>
            {/*<p>
                <FormattedMessage
                    id="stringWithEscapedCharacters"
                    defaultMessage={`User required in valid Domain\\User Format`}
                />
            </p>*/}
            <p>
                <FormattedMessage
                    id="stringWithEscapedCharacters"
                    defaultMessage={`User required in valid Domain\\\\User Format(CONFLICT: Escaping methods is different)`}
                />
            </p>
            <p>
                <FormattedHTMLMessage
                    id="stringWithHtmlTags"
                    defaultMessage={`Rotating API keys will <strong>destroy all of your Contrast agent deployments</strong>`}
                />
            </p>
            <p>
                <FormattedMessage
                    id="stringWithSingularAndPluralFormsPluralValue"
                    defaultMessage={`{count, plural, one {# Application} other {# Applications}}`}
                    values={{count: totalApplicationsPlural}}
                />
            </p>
            <p>
                <FormattedMessage
                    id="stringWithSingularAndPluralFormsSingularValue"
                    defaultMessage={`{count, plural, one {# Application} other {# Applications}}`}
                    values={{count: totalApplicationsSingular}}
                />
            </p>
            <p>
                <FormattedHTMLMessage
                    id="stringWithSingularAndPluralFormsAndHtmlTagsPluralValue"
                    defaultMessage={`{count, plural, one {<b>#</b> Attack Event} other {<b>#</b> Attack Events}}`}
                    values={{count: totalAttacksPlural}}
                />
            </p>
            <p>
                <FormattedHTMLMessage
                    id="stringWithSingularAndPluralFormsAndHtmlTagsSingularValue"
                    defaultMessage={`{count, plural, one {<b>#</b> Attack Event} other {<b>#</b> Attack Events}}`}
                    values={{count: totalAttacksSingular}}
                />
            </p>
            <p>
                <FormattedMessage
                    id="stringWithSingularPluralAndSpecificCountForms"
                    defaultMessage={`{count, plural, =0 {No Applications} one {# Application} other {# Applications}}`}
                    values={{count: totalApplicationsEmpty}}
                />
            </p>
            {/*<p>
                <FormattedMessage
                    id="stringWithVariableValues"
                    defaultMessage={`{{eventName}} Event from {{eventSource}}`}
                    values={{eventName: attackEventName, eventSource: attackEventSource }}
                />
            </p>*/}
            <p>
                <FormattedMessage
                    id="stringWithVariableValuesFixed"
                    defaultMessage={`{eventName} Event from {eventSource}`}
                    values={{eventName: attackEventName, eventSource: attackEventSource }}
                />
            </p>
            {/*<p>
                <FormattedHTMLMessage
                    id="stringWithVariableValuesAndHtmlTags"
                    defaultMessage={`This will delete the log enhancer <b>{{logEnhancerName}}</b>`}
                    values={{logEnhancerName: logEnhancer }}
                />
            </p>*/}
            <p>
                <FormattedHTMLMessage
                    id="stringWithVariableValuesAndHtmlTagsFixed"
                    defaultMessage={`This will delete the log enhancer <b>{logEnhancerName}</b>`}
                    values={{logEnhancerName: logEnhancer }}
                />
            </p>
            <p>
                <FormattedHTMLMessage
                    id="stringWithVariableValuesAndHtmlTagsWithParameters"
                    defaultMessage={`<span class='boldest'>{availableLicensesCount}</span> of {totalLicensesCount} Available (CONFLICT: this is ignoring class attr)`}
                    values={{availableLicensesCount: availableLicenses, totalLicensesCount: totalLicenses}}
                />
            </p>

        </div>
        );
    }
}


export default App;
