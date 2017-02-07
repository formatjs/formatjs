import Link from 'next/link';
import {FormattedNumber} from 'react-intl';
import pageWithIntl from '../components/PageWithIntl';

export default pageWithIntl(() => (
  <p>
    <Link href='/'><a>Home</a></Link>
    <FormattedNumber value={1000}/>
  </p>
));
