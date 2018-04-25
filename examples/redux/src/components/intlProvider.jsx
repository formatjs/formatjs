import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

const mapStateToProps = ({locales: {locale, messages}}) => ({
  key: locale,
  locale,
  messages
});

export default connect(mapStateToProps)(IntlProvider);
