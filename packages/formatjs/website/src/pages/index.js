import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: <>FormatJS is a set of JavaScript libraries.</>,
    imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        FormatJS is a modular collection of JavaScript libraries for internationalization that are focused on formatting numbers, dates, and strings for displaying to people. It includes a set of core libraries that build on the JavaScript Intl built-ins and industry-wide i18n standards, plus a set of integrations for common template and component libraries.
      </>
    ),
  },
  {
    title: <>Integrates with other libraries.</>,
    imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        For most web projects, internationalization happens in the template or view layer, so we've built integrations with React.
      </>
    ),
  },
  {
    title: <>Formats numbers, dates, and string messages.</>,
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    ),
  },
  {
    title: <>Runs in the browser and Node.js.</>,
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        FormatJS has been tested in all the major browsers on both desktop and mobile devices. Careful attention has been applied to make sure the libraries work in ES5 browsers all the way down to IE11.
        For many web apps rendering happens on the server, so we made sure FormatJS works perfectly in Node.js. This allows developers to use FormatJS on both the server and client-side of their apps.
      </>
    ),
  },
  {
    title: <>Built on standards.</>,
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        FormatJS is aligned with: ECMAScript Internationalization API (ECMA-402), Unicode CLDR, and ICU Message syntax. By building on these industry standards, FormatJS leverages APIs in modern browsers and works with the message syntax used by professional translators.
      </>
    ),
  },
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <header className={classnames('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/doc1')}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
