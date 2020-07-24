import React, {useState} from 'react';
import cx from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import {IntlProvider, FormattedMessage, useIntl} from 'react-intl';

import en from '../../lang/strings_en-US.json';
import fr from '../../lang/strings_fr-FR.json';
import ja from '../../lang/strings_ja-JP.json';
import cs from '../../lang/strings_cs-CZ.json';
import pt from '../../lang/strings_pt-BR.json';
import sv from '../../lang/strings_sv-SE.json';
import es from '../../lang/strings_es-AR.json';

const MESSAGES = {
  'en-US': en,
  'fr-FR': fr,
  'ja-JP': ja,
  'cs-CZ': cs,
  'pt-BR': pt,
  'sv-SE': sv,
  'es-AR': es,
};

function IntegrationSection({className}) {
  const intl = useIntl();
  return (
    <div className={cx(className, styles.integration)}>
      <div className={`row ${styles.imgs}`}>
        <a className="col col--6" href="https://github.com/formatjs/react-intl">
          <img
            src={useBaseUrl('/img/react.svg')}
            alt={intl.formatMessage({
              id: 'integration-react',
              defaultMessage: 'React',
            })}
          />
        </a>
        <a
          className="col col--6"
          href="https://github.com/ember-intl/ember-intl"
        >
          <img
            src={useBaseUrl('/img/ember.svg')}
            alt={intl.formatMessage({
              id: 'integration-ember',
              defaultMessage: 'Ember',
            })}
          />
        </a>
      </div>
      <h3>
        <FormattedMessage
          id="integration-title"
          defaultMessage="Integrates with other libraries."
        />
      </h3>
      <p>
        <FormattedMessage
          id="integration-desc"
          defaultMessage="For most web projects, internationalization happens in the template or view layer, so we've built integrations with React."
        />
      </p>
    </div>
  );
}

function IntroSection({className}) {
  return (
    <div className={cx(className, styles.intro)}>
      <div className={styles.layers}>
        <div className={styles.layer}>
          <p>
            <FormattedMessage
              id="intro-layer1"
              defaultMessage="FORMATJS INTEGRATIONS"
            />
          </p>
        </div>
        <div className={styles.layer}>
          <p>
            <FormattedMessage
              id="intro-layer2"
              defaultMessage="FORMATJS CORE LIBS"
            />
          </p>
        </div>
        <div className={styles.layer}>
          <p>
            <FormattedMessage
              id="intro-layer3"
              defaultMessage="ECMA-402 + FORMATJS POLYFILLS"
            />
          </p>
        </div>
      </div>
      <h3>
        <FormattedMessage
          id="intro-title"
          defaultMessage="FormatJS is a set of JavaScript libraries."
        />
      </h3>
      <p>
        <FormattedMessage
          id="intro-desc"
          defaultMessage="FormatJS is a modular collection of JavaScript libraries for internationalization that are focused on formatting numbers, dates, and strings for displaying to people. It includes a set of core libraries that build on the JavaScript Intl built-ins and industry-wide i18n standards, plus a set of integrations for common template and component libraries."
        />
      </p>
    </div>
  );
}

function EnvSection({className}) {
  const intl = useIntl();
  return (
    <div className={cx(className, styles.env)}>
      <div className={cx('row', styles.logos)}>
        <div className="col col--2">
          <img src={useBaseUrl('/img/chrome.png')} />
        </div>
        <div className="col col--2">
          <img src={useBaseUrl('/img/firefox.png')} />
        </div>
        <div className="col col--2">
          <img src={useBaseUrl('/img/safari.png')} />
        </div>
        <div className="col col--2">
          <img src={useBaseUrl('/img/edge.png')} />
        </div>
        <div className="col col--2">
          <img src={useBaseUrl('/img/ie11.png')} />
        </div>
        <div className="col col--2">
          <img src={useBaseUrl('/img/node.svg')} />
        </div>
      </div>
      <h3>
        <FormattedMessage
          id="env-title"
          defaultMessage="Runs in the browser and Node.js."
        />
      </h3>
      <p>
        <FormattedMessage
          id="env-desc"
          defaultMessage="FormatJS has been tested in all the major browsers (IE11, Chrome, FF & Safari) on both desktop and mobile devices. For many web apps rendering happens on the server, so we made sure FormatJS works perfectly in Node.js. This allows developers to use FormatJS on both the server and client-side of their apps."
        />
      </p>
    </div>
  );
}

function StandardsSection({className}) {
  return (
    <div className={cx(className, styles.standards)}>
      <img src={useBaseUrl('/img/js.svg')} />
      <h3>
        <FormattedMessage
          id="standards-title"
          defaultMessage="Built on standards."
        />
      </h3>
      <p>
        <FormattedMessage
          id="standards-desc"
          defaultMessage="FormatJS is aligned with: <ecma>ECMAScript Internationalization API (ECMA-402)</ecma>, <cldr>Unicode CLDR</cldr>, and <icu>ICU Message syntax</icu>. By building on these industry standards, FormatJS leverages APIs in modern browsers and works with the message syntax used by professional translators."
          values={{
            ecma: chunks => (
              <a href="https://www.ecma-international.org/ecma-402/">
                {chunks}
              </a>
            ),
            cldr: chunks => <a href="http://cldr.unicode.org/">{chunks}</a>,
            icu: chunks => (
              <a href="http://userguide.icu-project.org/formatparse/messages">
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </div>
  );
}

function Demo({className}) {
  const [count, setCount] = useState(0);
  const [lang, setLang] = useState('en-US');
  return (
    <div className={cx(className, styles.demo)}>
      <p>
        <span className={styles.exampleTitle}>
          <FormattedMessage id="demo-tagline" defaultMessage="Example" />
        </span>
        <span className={styles.example}>
          <IntlProvider
            locale={lang}
            defaultLocale="en-US"
            messages={MESSAGES[lang]}
          >
            <FormattedMessage
              id="demo"
              values={{
                numPhotos: count,
                takenDate: new Date(),
                name: 'Annie',
              }}
            />
          </IntlProvider>
        </span>
      </p>
      <label>
        <FormattedMessage id="demo-photos" defaultMessage="# Photos" />{' '}
        <input
          value={count}
          type="number"
          onChange={e => setCount(+e.target.value)}
        />
      </label>
      <label>
        <FormattedMessage id="demo-langs" defaultMessage="Locale" />{' '}
        <select onChange={e => setLang(e.target.value)}>
          <option value="en-US">en-US</option>
          <option value="fr-FR">fr-FR</option>
          <option value="ja-JP">ja-JP</option>
          <option value="cs-CZ">cs-CZ</option>
          <option value="pt-BR">pt-BR</option>
          <option value="sv-SE">sv-SE</option>
          <option value="es-AR">es-AR</option>
        </select>
      </label>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;

  return (
    <>
      <header
        className={cx('hero hero--primary', styles.heroBanner)}
        style={{
          backgroundImage: `url(${useBaseUrl('/img/splash-head.jpg')})`,
        }}
      >
        <div className="container">
          <h1 className="hero__title">
            <img src={useBaseUrl('/img/logo-header.svg')} />
          </h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <Demo />
          <div className={styles.buttons}>
            <Link
              className={cx(
                'button button--outline button--secondary button--lg',
                styles.getStarted
              )}
              to={useBaseUrl('docs/basic-internationalization-principles')}
            >
              <FormattedMessage
                defaultMessage="Get Started"
                id="header-started"
              />
            </Link>
          </div>
        </div>
      </header>
      <main className={styles.features}>
        <div className="container">
          <div className="row">
            <IntroSection className="col col--4" />
            <IntegrationSection className="col col--4" />
            <StandardsSection className="col col--4" />
          </div>
          <div className="row">
            <EnvSection className="col col--12" />
          </div>
        </div>
      </main>
    </>
  );
}

function App() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <IntlProvider locale="en" messages={{}}>
      <Layout title={siteConfig.title} description={siteConfig.tagline}>
        <Home />
      </Layout>
    </IntlProvider>
  );
}

export default App;
