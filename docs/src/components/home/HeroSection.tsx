import * as React from 'react'
import {Link as WouterLink} from 'wouter'
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  defineMessage,
  IntlProvider,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl'

const LOCALES = [
  {code: 'en-US', label: 'English (US)'},
  {code: 'es-AR', label: 'Español (AR)'},
  {code: 'fr-FR', label: 'Français'},
  {code: 'de-DE', label: 'Deutsch'},
  {code: 'ja-JP', label: '日本語'},
  {code: 'pt-BR', label: 'Português (BR)'},
]

const messages = {
  'en-US': {
    photoCount:
      '{name} took {numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}} on {takenDate, date, long}.',
  },
  'es-AR': {
    photoCount:
      '{name} {numPhotos, plural, =0 {no} =1 {una} other {#}} {numPhotos, plural, =0 {fotos} =1 {foto} other {fotos}} el {takenDate, date, long}.',
  },
  'fr-FR': {
    photoCount:
      '{name} a pris {numPhotos, plural, =0 {aucune photo} =1 {une photo} other {# photos}} le {takenDate, date, long}.',
  },
  'de-DE': {
    photoCount:
      '{name} hat am {takenDate, date, long} {numPhotos, plural, =0 {keine Fotos} =1 {ein Foto} other {# Fotos}} aufgenommen.',
  },
  'ja-JP': {
    photoCount:
      '{name}は{takenDate, date, long}に{numPhotos, plural, =0 {写真を撮りませんでした} other {#枚の写真を撮りました}}。',
  },
  'pt-BR': {
    photoCount:
      '{name} tirou {numPhotos, plural, =0 {nenhuma foto} =1 {uma foto} other {# fotos}} em {takenDate, date, long}.',
  },
}

const MESSAGE: MessageDescriptor = defineMessage({
  id: 'photoCount',
  defaultMessage:
    '{name} took {numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}} on {takenDate, date, long}.',
})

function ExampleMessage({
  values,
}: {
  values: Record<string, any>
}): React.ReactNode {
  const intl = useIntl()
  return (
    <TextField
      label="Example"
      value={intl.formatMessage(MESSAGE, values)}
      aria-readonly
      fullWidth
    />
  )
}

export default function HeroSection(): React.ReactNode {
  const [selectedLocale, setSelectedLocale] = React.useState('en-US')
  const [numPhotos, setNumPhotos] = React.useState(0)

  return (
    <Box
      sx={{
        backgroundImage: 'url(/img/splash-head.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        py: {xs: 3, md: 6},
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{textAlign: 'center', mb: {xs: 1, md: 2}}}>
          <Box
            component="img"
            src="/img/logo-header.svg"
            alt="FormatJS"
            sx={{
              height: {xs: 60, sm: 80, md: 100},
              mb: 1,
            }}
          />
          <Typography variant="h5">
            Internationalize your web apps on the client & server.
          </Typography>
        </Box>

        {/* Interactive Example */}
        <Grid2 container>
          <Grid2 size={12}>
            <Box sx={{mb: 4}}>
              <IntlProvider
                locale={selectedLocale}
                messages={
                  messages[selectedLocale as keyof typeof messages] || {}
                }
              >
                <ExampleMessage
                  values={{
                    name: 'Alex',
                    numPhotos: numPhotos,
                    takenDate: new Date(2023, 2, 15),
                  }}
                />
              </IntlProvider>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <TextField
                type="number"
                label="# Photos"
                value={numPhotos}
                onChange={e => setNumPhotos(Number(e.target.value))}
                size="small"
                sx={{width: 150}}
              />
              <FormControl size="small" sx={{minWidth: 150}}>
                <InputLabel id="locale-select-label">Locale</InputLabel>
                <Select
                  labelId="locale-select-label"
                  label="Locale"
                  value={selectedLocale}
                  onChange={e => setSelectedLocale(e.target.value)}
                >
                  {LOCALES.map(locale => (
                    <MenuItem key={locale.code} value={locale.code}>
                      {locale.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid2>
          <Grid2
            size={12}
            sx={{
              textAlign: 'center',
            }}
          >
            <WouterLink href="/docs/getting-started/installation">
              <Button variant="contained" size="large">
                Get Started
              </Button>
            </WouterLink>
          </Grid2>
        </Grid2>
      </Container>
    </Box>
  )
}
