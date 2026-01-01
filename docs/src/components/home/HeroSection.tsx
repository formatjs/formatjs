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

function ExampleOutput({
  values,
}: {
  values: Record<string, any>
}): React.ReactNode {
  const intl = useIntl()
  return (
    <p className="text-lg font-medium text-gray-800">
      {intl.formatMessage(MESSAGE, values)}
    </p>
  )
}

export default function HeroSection(): React.ReactNode {
  const [selectedLocale, setSelectedLocale] = React.useState('en-US')
  const [numPhotos, setNumPhotos] = React.useState(0)

  return (
    <div className="relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800" />

      {/* Animated background shapes */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        {/* Logo and headline */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 relative">
            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-2xl" />
            <img
              src="/img/logo-header.svg"
              alt="FormatJS"
              className="relative h-20 md:h-28 mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Internationalize your web apps
            <br />
            <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              on the client & server
            </span>
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
            Industry-standard i18n libraries for JavaScript. Built on ICU
            Message syntax.
          </p>
        </div>

        {/* Interactive demo card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-sm font-medium text-gray-600">
                  Live Demo
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Output
                </label>
                <IntlProvider
                  locale={selectedLocale}
                  messages={
                    messages[selectedLocale as keyof typeof messages] || {}
                  }
                >
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
                    <ExampleOutput
                      values={{
                        name: 'Alex',
                        numPhotos: numPhotos,
                        takenDate: new Date(2023, 2, 15),
                      }}
                    />
                  </div>
                </IntlProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  # Photos
                </label>
                <Input
                  type="number"
                  value={numPhotos}
                  onChange={e => setNumPhotos(Number(e.target.value))}
                  className="w-full h-11 text-base text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Locale
                </label>
                <select
                  value={selectedLocale}
                  onChange={e => setSelectedLocale(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {LOCALES.map(locale => (
                    <option key={locale.code} value={locale.code}>
                      {locale.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-4 border-t border-gray-200">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <a href="/docs/getting-started/installation">
                  Get Started
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2"
              >
                <a href="/docs/core-concepts/basic-internationalization-principles">
                  Learn More
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats or badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            {label: 'NPM Downloads', value: '50M+/month'},
            {label: 'GitHub Stars', value: '14K+'},
            {label: 'Languages', value: '150+'},
            {label: 'Companies', value: '1000+'},
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-purple-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
