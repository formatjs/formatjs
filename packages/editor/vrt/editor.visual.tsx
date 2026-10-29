import {useState, type ReactElement, type ReactNode} from 'react'
import {
  useTranslationEditor,
  resolveSourceLocationHref,
  type EditorMessage,
} from '@formatjs/editor'
import {
  TranslationEditorView,
  EditorDesignSystemProvider,
  MessageContext,
} from '@formatjs/editor/ui'
import {stylexEditorComponents} from '../demo/design-system/editor-components.js'
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

const projects = [
  {id: 'web', label: 'Web app'},
  {id: 'mobile', label: 'Mobile app'},
]
const projectMessages: Record<string, EditorMessage[]> = {
  web: [
    {
      id: 'welcome',
      defaultMessage: 'Welcome, {name}',
      translations: {fr: 'Bonjour, {name}'},
      catalogs: ['homepage'],
      sources: ['main', 'release/2026.10'],
      description: 'Greeting shown after sign-in',
      locations: [
        {
          file: 'src/home.tsx',
          start: 12,
          end: 18,
          repository: 'acme/web',
          revision: 'main',
        },
      ],
    },
    {
      id: 'checkout',
      defaultMessage: 'Proceed to checkout',
      translations: {},
      sources: ['release/2026.10'],
    },
    {
      id: 'legacy',
      defaultMessage: 'Legacy message without source metadata',
      translations: {},
    },
  ],
  mobile: [
    {
      id: 'settings',
      defaultMessage: 'Open settings',
      translations: {fr: 'Ouvrir les paramètres'},
      sources: ['android', 'ios'],
      locations: [
        {
          file: 'src/settings.tsx',
          start: 42,
          repository: 'acme/mobile',
          revision: 'release',
        },
      ],
    },
  ],
}

export function ProjectsFixture(): ReactElement {
  const [project, setProject] = useState('web')
  const [blocked, setBlocked] = useState(false)
  const workflow = useTranslationEditor({
    projects,
    project,
    onProjectChange: setProject,
    messages: projectMessages[project],
    locales: ['fr'],
    onSave: () => {},
  })
  const selected = workflow.selectedMessage
  const draft = selected && workflow.getTranslation(selected.id, 'fr')
  return (
    <EditorDesignSystemProvider components={stylexEditorComponents}>
      <TranslationEditorView
        projects={{
          projects,
          value: workflow.project?.id,
          onChange: id => {
            setBlocked(workflow.setProject(id).status === 'blocked')
          },
        }}
        sourceFilter={{
          sources: workflow.sources,
          value: workflow.source,
          onChange: workflow.setSource,
        }}
        messages={workflow.pageMessages.map(message =>
          projectMessages[project].find(value => value.id === message.id)!
        )}
        selectedMessage={selected}
        onSelect={workflow.editor.selectMessage}
        search={{
          value: workflow.editor.query,
          onValueChange: workflow.editor.setQuery,
        }}
        translations={
          draft ? [{locale: 'fr', label: 'French translation', draft}] : []
        }
        notice={
          blocked && (
            <p role="alert">
              Reset unsaved translations before switching projects.
            </p>
          )
        }
        context={
          <MessageContext
            message={selected}
            copySources
            renderLocation={(location, text) => (
              <a
                href={resolveSourceLocationHref(location, {
                  baseUrl:
                    'https://git.example.com/{repository}/blob/{revision}',
                })}
              >
                {text}
              </a>
            )}
          />
        }
      />
    </EditorDesignSystemProvider>
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
  const input = element
    ? (document.getElementById(element.htmlFor) as HTMLSelectElement)
    : [...document.querySelectorAll('select')].find(
        input => input.getAttribute('aria-label') === label
      )
  if (!input) throw new Error(`Missing control: ${label}`)
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
        visualId: 'projects',
        name: 'Projects and sources',
        render: () => (
          <EditorTestShell>
            <ProjectsFixture />
          </EditorTestShell>
        ),
        vrt: {screenshotName: 'editor-projects'},
      },
      {
        visualId: 'projects-filtered',
        name: 'Filtered project sources',
        render: () => (
          <EditorTestShell>
            <ProjectsFixture />
          </EditorTestShell>
        ),
        beforeCapture: () => select('Source', 'release/2026.10'),
        vrt: {screenshotName: 'editor-projects-filtered'},
      },
      {
        visualId: 'projects-switched',
        name: 'Switched project',
        render: () => (
          <EditorTestShell>
            <ProjectsFixture />
          </EditorTestShell>
        ),
        beforeCapture: async () => {
          await select('Source', 'release/2026.10')
          await select('Project', 'mobile')
        },
        vrt: {screenshotName: 'editor-projects-switched'},
      },
      {
        visualId: 'projects-mobile-rtl',
        name: 'Narrow RTL projects and sources',
        render: () => (
          <EditorTestShell direction="rtl">
            <ProjectsFixture />
          </EditorTestShell>
        ),
        vrt: {
          screenshotName: 'editor-projects-mobile-rtl',
          viewport: {width: 390, height: 844},
        },
      },
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
