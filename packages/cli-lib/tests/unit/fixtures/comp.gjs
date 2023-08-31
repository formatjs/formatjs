import formatMessage from 'ember-intl/helpers/format-message';
import or from 'ember-truth-helpers/helpers/or';
import Component from '@glimmer/component';
import {service} from '@ember/service';

export default class Comp extends Component {
  @service intl;

  get message() {
      return this.intl.formatMessage({
          defualtMessage: 'in gjs file'
      });
  }

  <template>
      <p>
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
