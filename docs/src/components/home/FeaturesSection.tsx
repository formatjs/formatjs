import * as React from 'react'
import {Box, Container, Link, Typography, useTheme} from '@mui/material'
import Grid from '@mui/material/Grid2'

export default function FeaturesSection(): React.ReactNode {
  const theme = useTheme()

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        pt: {xs: 6, md: 8},
        pb: {xs: 4, md: 6},
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* First column - Stacked colored boxes on top, text below */}
          <Grid size={{xs: 12, md: 4}}>
            <Grid container spacing={0} sx={{mb: 3}}>
              <Grid
                size={12}
                sx={{
                  bgcolor: 'primary.main',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 50,
                }}
              >
                <Typography
                  sx={{
                    textTransform: 'uppercase',
                  }}
                  variant="body2"
                >
                  FormatJS Integrations
                </Typography>
              </Grid>
              <Grid
                size={12}
                sx={{
                  bgcolor: '#8339c2',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 50,
                }}
              >
                <Typography
                  sx={{
                    textTransform: 'uppercase',
                  }}
                  variant="body2"
                >
                  FormatJS Core Libs
                </Typography>
              </Grid>
              <Grid
                size={12}
                sx={{
                  bgcolor: 'warning.main',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 50,
                }}
              >
                <Typography
                  sx={{
                    color: 'black',
                    textTransform: 'uppercase',
                  }}
                  variant="body2"
                >
                  ECMA-402 + FormatJS Polyfills
                </Typography>
              </Grid>
            </Grid>

            <Typography
              variant="h5"
              gutterBottom
              sx={{fontWeight: 600, fontSize: {xs: '1.25rem', md: '1.5rem'}}}
            >
              FormatJS is a set of JavaScript libraries.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              component="p"
              sx={{fontSize: {xs: '0.9rem', md: '1rem'}}}
            >
              FormatJS is a modular collection of JavaScript libraries for
              internationalization that are focused on formatting numbers,
              dates, and strings for displaying to people. It includes a set of
              core libraries that build on the JavaScript Intl built-ins and
              industry-wide i18n standards, plus a set of integrations for
              common template and component libraries.
            </Typography>
          </Grid>

          {/* Middle-Right - Integrations with logos */}
          <Grid size={{xs: 12, md: 4}}>
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 150,
                mb: 3,
                flexWrap: 'nowrap',
              }}
            >
              <Box
                component="img"
                src="/img/react.svg"
                alt="React"
                sx={{maxHeight: 150, maxWidth: '30%', objectFit: 'contain'}}
              />
              <Box
                component="img"
                src="/img/ember.svg"
                alt="Ember"
                sx={{maxHeight: 150, maxWidth: '30%', objectFit: 'contain'}}
              />
              <Box
                component="img"
                src="/img/vue-logo.svg"
                alt="Vue"
                sx={{maxHeight: 150, maxWidth: '30%', objectFit: 'contain'}}
              />
            </Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{fontWeight: 600, fontSize: {xs: '1.25rem', md: '1.5rem'}}}
            >
              Integrates with other libraries.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              component="p"
              sx={{fontSize: {xs: '0.9rem', md: '1rem'}}}
            >
              For most web projects, internationalization happens in the
              template or view layer, so we've built integrations with React &
              Vue.
            </Typography>
          </Grid>

          {/* Right - JS logo and Built on standards */}
          <Grid size={{xs: 12, md: 4}}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 150,
                mb: 3,
              }}
            >
              <Box
                component="img"
                src="/img/js.svg"
                alt="JavaScript"
                sx={{height: 150, width: 150}}
              />
            </Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{fontWeight: 600, fontSize: {xs: '1.25rem', md: '1.5rem'}}}
            >
              Built on standards.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{fontSize: {xs: '0.9rem', md: '1rem'}}}
            >
              FormatJS is aligned with:{' '}
              <Link
                href="https://tc39.es/ecma402/"
                target="_blank"
                color="primary"
              >
                ECMAScript
              </Link>
              ,{' '}
              <Link
                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl"
                target="_blank"
                color="primary"
              >
                Internationalization API (ECMA-402)
              </Link>
              ,{' '}
              <Link
                href="http://cldr.unicode.org/"
                target="_blank"
                color="primary"
              >
                Unicode CLDR
              </Link>
              , and{' '}
              <Link
                href="https://unicode-org.github.io/icu/userguide/format_parse/messages/"
                target="_blank"
                color="primary"
              >
                ICU Message syntax
              </Link>
              . By building on these industry standards, FormatJS works on the
              web and works in modern browsers and works with the message syntax
              used by professional translators.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
