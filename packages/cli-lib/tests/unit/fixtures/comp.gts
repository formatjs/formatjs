import formatMessage from 'ember-intl/helpers/format-message';
import or from 'ember-truth-helpers/helpers/or';
import Component from '@glimmer/component';
import {service} from '@ember/service';

/*
 * We don't want to support ids passed to formatMessage in templates,
 * because the accidental risk of collision is too high.
 *
 * They are supported in JS because it's an API that we don't control.
 */
const Header = <template>
  <header>{{formatMessage 'hello from a secondary component in the same file'}}</header>
</template>;


interface Signature {
   Element: HTMLElement; 
}

export default class Comp extends Component<Signature> {
  @service intl;

  get message() {
      return this.intl.formatMessage({
          defaultMessage: 'js getter with an id',
          id: 'getter-message',
      });
  }

  get message2() {
      return this.intl.formatMessage({
          defaultMessage: 'js getter with no id',
      });
  }

  <template>
      <Header />
      <p ...attributes>
        {{formatMessage 'in template' 'in template desc'}}
      </p>

      <p>
        {{formatMessage
          '{connectorName, select,
              none {Install Service}
              other {Install {connectorName}}
          }'
          name=(or this.name 'none')
        }}
      </p>

      <!-- prettier-ignore -->
      <p>
        {{formatMessage
          '{connectorName, select,
                  none {Install Service}
                  other {Install {connectorName}}
          }'
          name=(or this.name 'none')
       }}
      </p>

      <p>
        {{formatMessage
          "Very long message with
          multiple'' breaklines
          and multiple spaces
          '<a href={href}>' Link '</a>'"
          'Nice description'
          href='/whatever/link'
          htmlSafe=true
        }}
      </p>

      <!-- this is the same as above but is nested so it contains more whitespaces -->
      <div>
        <p>
          {{formatMessage
            "Very long message with
                multiple'' breaklines
                and multiple spaces
                '<a href={href}>' Link '</a>'"
            'Nice
                description'
            href='/whatever/link'
            htmlSafe=true
          }}
        </p>
      </div>
  </template>
}
