import * as React from 'react'
import {
  defineMessage,
  IntlProvider,
  MessageDescriptor,
  useIntl,
} from 'react-intl'
import {Button} from '../ui/button'
import {Input} from '../ui/input'

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
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">Example</label>
      <Input
        value={intl.formatMessage(MESSAGE, values)}
        readOnly
        className="w-full"
      />
    </div>
  )
}

export default function HeroSection(): React.ReactNode {
  const [selectedLocale, setSelectedLocale] = React.useState('en-US')
  const [numPhotos, setNumPhotos] = React.useState(0)

  return (
    <div
      className="relative bg-cover bg-center py-6 px-4 md:py-12"
      style={{backgroundImage: 'url(/img/splash-head.jpg)'}}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-8">
          <img
            src="/img/logo-header.svg"
            alt="FormatJS"
            className="h-[60px] sm:h-[80px] md:h-[100px] mb-4 mx-auto"
          />
          <h1 className="text-xl md:text-2xl">
            Internationalize your web apps on the client & server.
          </h1>
        </div>

        {/* Interactive Example */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="mb-8">
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
            </div>

            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium mb-2">
                  # Photos
                </label>
                <Input
                  type="number"
                  value={numPhotos}
                  onChange={e => setNumPhotos(Number(e.target.value))}
                  className="w-full sm:w-[150px]"
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium mb-2">Locale</label>
                <select
                  value={selectedLocale}
                  onChange={e => setSelectedLocale(e.target.value)}
                  className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {LOCALES.map(locale => (
                    <option key={locale.code} value={locale.code}>
                      {locale.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Button asChild size="lg">
              <a href="/docs/getting-started/installation">Get Started</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
