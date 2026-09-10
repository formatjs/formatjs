import {useState, type ReactElement, type ReactNode} from 'react'
import type {EditorMessage} from '@formatjs/editor'
import type {
  ComponentVisualModule,
  ComponentVisual,
} from '@rules-web-e2e/vrt/visual'
import {TranslationToolsDemo} from '../demo/tools-demo.js'
import {EditorDemo} from '../demo/demo.js'
import {TranslationEditorDemo} from '../demo/workflow-demo.js'
import {EditorTestShell} from './shell.js'

export function Editable({
  direction = 'ltr',
}: {
  direction?: 'ltr' | 'rtl'
}): ReactElement {
  return (
    <EditorTestShell direction={direction}>
      <EditorDemo
        initialMessages={[
          {
            id: 'welcome',
            defaultMessage: 'Welcome, {name}',
            translatedMessage: '',
          },
          {
            id: 'messages',
            defaultMessage: 'You have {count, number} messages',
            translatedMessage: '',
          },
          {
            id: 'updated',
            defaultMessage: 'Updated {date, date, short}',
            translatedMessage: '',
          },
        ]}
      />
    </EditorTestShell>
  )
}

export function WorkflowFixture(): ReactElement {
  const [messages, setMessages] = useState<EditorMessage[]>([
    {
      id: 'welcome',
      defaultMessage: 'Welcome, {name}',
      translations: {},
      catalogs: ['web'],
      description: 'Greeting shown after sign-in',
      locations: [{file: 'src/home.tsx', start: 12}],
    },
    {
      id: 'messages',
      defaultMessage: 'You have {count, number} messages',
      translations: {},
      catalogs: ['mobile'],
    },
    {
      id: 'updated',
      defaultMessage: 'Updated {date, date, short}',
      translations: {},
      catalogs: ['web'],
    },
  ])
  return (
    <TranslationEditorDemo
      messages={messages}
      locales={['fr', 'ru']}
      pageSize={2}
      onSave={async update => {
        setMessages(current =>
          current.map(message =>
            message.id === update.id
              ? {
                  ...message,
                  translations: {
                    ...message.translations,
                    [update.locale]: update.translation,
                  },
                }
              : message
          )
        )
      }}
    />
  )
}

const frame = (): Promise<void> =>
  new Promise(resolve => requestAnimationFrame(() => resolve()))
async function fillTranslation(
  value: string,
  keepFocus = false
): Promise<void> {
  const input = document.querySelector('textarea')!
  Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  )!.set!.call(input, value)
  input.dispatchEvent(new Event('input', {bubbles: true}))
  await frame()
  if (keepFocus) input.focus()
  else input.blur()
}
async function select(label: string, value: string): Promise<void> {
  const element = [...document.querySelectorAll('label')].find(
    element => element.firstChild?.textContent?.trim() === label
  )
  if (!element) throw new Error(`Missing control: ${label}`)
  const input = document.getElementById(element.htmlFor) as HTMLSelectElement
  input.value = value
  input.dispatchEvent(new Event('change', {bubbles: true}))
  await frame()
}
async function savedWorkflow(): Promise<void> {
  await fillTranslation('Bonjour, {name}')
  await select('Target locale', 'ru')
  await fillTranslation('Привет, {name}')
  await select('Target locale', 'fr')
  const button = [...document.querySelectorAll('button')].find(
    button => button.textContent?.trim() === 'Save translation'
  )
  if (!button) throw new Error('Missing save button')
  button.click()
  for (let attempt = 0; attempt < 120; attempt++) {
    if (document.querySelector('output')?.textContent === 'Translation saved.')
      break
    await frame()
  }
  if (document.querySelector('output')?.textContent !== 'Translation saved.')
    throw new Error('Save did not complete')
  await select('Status', 'translated')
}
const visualModule: ComponentVisualModule<ReactNode> = {
  id: 'Editor',
  title: 'Message editor',
  renderShell: children => <div id="editor-root">{children}</div>,
  visuals: (
    [
      {
        visualId: 'tools',
        name: 'Reusable tools',
        render: () => <TranslationToolsDemo />,
        beforeCapture: async () => {
          document
            .querySelector<HTMLButtonElement>('button[aria-expanded]')!
            .click()
          await frame()
          await frame()
        },
        vrt: {screenshotName: 'editor-tools'},
      },
      {
        visualId: 'tools-mobile-rtl',
        name: 'Narrow RTL tools',
        render: () => (
          <div dir="rtl">
            <TranslationToolsDemo />
          </div>
        ),
        beforeCapture: async () => {
          document
            .querySelector<HTMLButtonElement>('button[aria-expanded]')!
            .click()
          await frame()
          await frame()
        },
        vrt: {
          screenshotName: 'editor-tools-mobile-rtl',
          viewport: {width: 390, height: 844},
        },
      },
      {
        visualId: 'Editable',
        name: 'Editable',
        render: props => (
          <Editable direction={props?.direction as 'ltr' | 'rtl' | undefined} />
        ),
        vrt: false,
      },
      {
        visualId: 'loaded',
        name: 'Loaded',
        render: () => <Editable />,
        vrt: {screenshotName: 'editor-loaded'},
      },
      {
        visualId: 'editing',
        name: 'Editing',
        render: () => <Editable />,
        beforeCapture: () => fillTranslation('Bonjour, {name}'),
        vrt: {screenshotName: 'editor-editing'},
      },
      {
        visualId: 'invalid',
        name: 'Invalid ICU',
        render: () => <Editable />,
        beforeCapture: () => fillTranslation('{name', true),
        vrt: {screenshotName: 'editor-invalid'},
      },
      {
        visualId: 'mobile-rtl',
        name: 'Narrow RTL',
        render: () => <Editable direction="rtl" />,
        beforeCapture: () => fillTranslation('مرحبًا، {name}'),
        vrt: {
          screenshotName: 'editor-mobile-rtl',
          viewport: {width: 390, height: 844},
        },
      },
      {
        visualId: 'workflow',
        name: 'Saved workflow',
        render: () => (
          <EditorTestShell>
            <WorkflowFixture />
          </EditorTestShell>
        ),
        beforeCapture: savedWorkflow,
        vrt: {screenshotName: 'editor-workflow'},
      },
      {
        visualId: 'workflow-mobile-rtl',
        name: 'Narrow RTL workflow',
        render: () => (
          <EditorTestShell direction="rtl">
            <WorkflowFixture />
          </EditorTestShell>
        ),
        vrt: {
          screenshotName: 'editor-workflow-mobile-rtl',
          viewport: {width: 390, height: 844},
        },
      },
    ] satisfies ComponentVisual<ReactNode>[]
  ).map(visual => ({
    ...visual,
    getScreenshotElement: () => document.getElementById('editor-root')!,
  })),
}
export default visualModule
