#!/usr/bin/env node
/**
 * Generates test files with a mix of simple and complex ICU MessageFormat messages
 * for benchmarking the Rust CLI vs TypeScript CLI
 */

import fs from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const NUM_FILES = process.env.NUM_FILES
  ? parseInt(process.env.NUM_FILES)
  : 100_000
const OUTPUT_DIR = path.join(__dirname, 'test-files')
const FILES_PER_DIR = 1000 // Split into subdirectories to avoid filesystem limits

// Message templates - mix of simple and complex
const MESSAGE_TEMPLATES = {
  simple: [
    'Hello, World!',
    'Welcome to our application',
    'Click here to continue',
    'Loading...',
    'Save changes',
    'Cancel',
    'Are you sure?',
    'Success!',
    'Error occurred',
    'Please try again',
  ],
  withVariables: [
    'Hello, {name}!',
    'You have {count} unread messages',
    'Welcome back, {username}',
    'Last login: {date}',
    'Your balance is {amount}',
    '{user} sent you a message',
    'Expires on {expiryDate}',
    'Created by {author} on {date}',
  ],
  plural: [
    '{count, plural, one {# item} other {# items}}',
    '{count, plural, =0 {No messages} one {# message} other {# messages}}',
    '{numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}}',
    'You have {count, plural, one {# new notification} other {# new notifications}}',
    '{taskCount, plural, =0 {No tasks} one {# task remaining} other {# tasks remaining}}',
  ],
  select: [
    '{gender, select, male {He} female {She} other {They}} liked your post',
    '{status, select, active {Active user} inactive {Inactive} other {Unknown status}}',
    'Order is {orderStatus, select, pending {being processed} shipped {on the way} delivered {completed} other {unknown}}',
  ],
  complex: [
    '{count, plural, one {You have # message from {sender}} other {You have # messages}}',
    '{numPhotos, plural, =0 {<bold>{name}</bold> has no photos} =1 {<bold>{name}</bold> has one photo} other {<bold>{name}</bold> has # photos}}',
    '{gender, select, male {He has {count, plural, one {# item} other {# items}}} female {She has {count, plural, one {# item} other {# items}}} other {They have {count, plural, one {# item} other {# items}}}}',
    'Welcome <link>back</link>, {username}! You have {msgCount, plural, =0 {no new messages} one {# new message} other {# new messages}} and {taskCount, plural, =0 {no pending tasks} one {# pending task} other {# pending tasks}}.',
    '{itemCount, plural, =0 {Your cart is empty} one {You have <bold>{itemCount}</bold> item in your cart for <price>{total}</price>} other {You have <bold>{itemCount}</bold> items in your cart for <price>{total}</price>}}',
  ],
}

// Distribution: 40% simple, 30% with variables, 15% plural, 10% select, 5% complex
const MESSAGE_DISTRIBUTION = [
  {type: 'simple', weight: 40},
  {type: 'withVariables', weight: 30},
  {type: 'plural', weight: 15},
  {type: 'select', weight: 10},
  {type: 'complex', weight: 5},
]

function selectRandomMessage() {
  const random = Math.random() * 100
  let cumulative = 0

  for (const {type, weight} of MESSAGE_DISTRIBUTION) {
    cumulative += weight
    if (random < cumulative) {
      const templates = MESSAGE_TEMPLATES[type]
      return templates[Math.floor(Math.random() * templates.length)]
    }
  }

  return MESSAGE_TEMPLATES.simple[0]
}

function generateFileContent(fileIndex) {
  const numMessages = Math.floor(Math.random() * 10) + 5 // 5-15 messages per file

  const messages = []
  for (let i = 0; i < numMessages; i++) {
    const messageId = `msg_${fileIndex}_${i}`
    const defaultMessage = selectRandomMessage()
    messages.push({
      id: messageId,
      defaultMessage,
      description: `Message ${i} in file ${fileIndex}`,
    })
  }

  // Mix different patterns: defineMessages, defineMessage, formatMessage, FormattedMessage
  const formatType = fileIndex % 4

  if (formatType === 0) {
    // defineMessages pattern (group of messages)
    const imports = `import {defineMessages} from 'react-intl'\n\n`
    const messagesObj = messages
      .map(
        msg => `  ${msg.id}: {
    id: '${msg.id}',
    defaultMessage: '${msg.defaultMessage.replace(/'/g, "\\'")}',
    description: '${msg.description}',
  }`
      )
      .join(',\n')

    const component = `
const messages = defineMessages({
${messagesObj}
})

export function Component${fileIndex}() {
  return <div>{/* Component content */}</div>
}
`
    return imports + component
  } else if (formatType === 1) {
    // defineMessage pattern (individual messages)
    const imports = `import {defineMessage} from 'react-intl'\n\n`
    const messageDefs = messages
      .map(
        msg => `const ${msg.id} = defineMessage({
  id: '${msg.id}',
  defaultMessage: '${msg.defaultMessage.replace(/'/g, "\\'")}',
  description: '${msg.description}',
})`
      )
      .join('\n\n')

    const component = `
export function Component${fileIndex}() {
  return <div>{/* Component content */}</div>
}
`
    return imports + messageDefs + component
  } else if (formatType === 2) {
    // formatMessage pattern (intl.formatMessage)
    const imports = `import {useIntl} from 'react-intl'\n\n`
    const formatCalls = messages
      .map(
        msg =>
          `  const ${msg.id} = intl.formatMessage({
    id: '${msg.id}',
    defaultMessage: '${msg.defaultMessage.replace(/'/g, "\\'")}',
    description: '${msg.description}',
  })`
      )
      .join('\n')

    const component = `
export function Component${fileIndex}() {
  const intl = useIntl()
${formatCalls}
  return <div>{/* Component content */}</div>
}
`
    return imports + component
  } else {
    // FormattedMessage pattern (JSX component)
    const imports = `import {FormattedMessage} from 'react-intl'\n\n`
    const jsxMessages = messages
      .map(
        msg =>
          `      <FormattedMessage
        id="${msg.id}"
        defaultMessage="${msg.defaultMessage.replace(/"/g, '&quot;')}"
        description="${msg.description}"
      />`
      )
      .join('\n')

    const component = `
export function Component${fileIndex}() {
  return (
    <div>
${jsxMessages}
    </div>
  )
}
`
    return imports + component
  }
}

async function generateFiles() {
  console.log(`Generating ${NUM_FILES.toLocaleString()} test files...`)
  console.time('Generation time')

  // Clean and recreate output directory
  try {
    await fs.rm(OUTPUT_DIR, {recursive: true})
  } catch {
    // Directory doesn't exist, that's fine
  }
  await fs.mkdir(OUTPUT_DIR, {recursive: true})

  // Generate files in batches
  const numSubdirs = Math.ceil(NUM_FILES / FILES_PER_DIR)

  for (let dirIndex = 0; dirIndex < numSubdirs; dirIndex++) {
    const subdirName = `batch_${dirIndex.toString().padStart(4, '0')}`
    const subdirPath = path.join(OUTPUT_DIR, subdirName)
    await fs.mkdir(subdirPath, {recursive: true})

    const filesInThisDir = Math.min(
      FILES_PER_DIR,
      NUM_FILES - dirIndex * FILES_PER_DIR
    )

    // Generate files in parallel batches of 100 to avoid overwhelming the system
    const BATCH_SIZE = 100
    for (let batch = 0; batch < filesInThisDir; batch += BATCH_SIZE) {
      const batchEnd = Math.min(batch + BATCH_SIZE, filesInThisDir)
      const promises = []

      for (let i = batch; i < batchEnd; i++) {
        const fileIndex = dirIndex * FILES_PER_DIR + i
        const fileName = `file_${fileIndex.toString().padStart(6, '0')}.tsx`
        const filePath = path.join(subdirPath, fileName)
        const content = generateFileContent(fileIndex)
        promises.push(fs.writeFile(filePath, content, 'utf8'))
      }

      await Promise.all(promises)
    }

    if ((dirIndex + 1) % 10 === 0) {
      const progress = ((dirIndex + 1) / numSubdirs) * 100
      console.log(
        `Progress: ${progress.toFixed(1)}% (${((dirIndex + 1) * FILES_PER_DIR).toLocaleString()} files)`
      )
    }
  }

  console.timeEnd('Generation time')
  console.log(
    `✓ Generated ${NUM_FILES.toLocaleString()} files in ${OUTPUT_DIR}`
  )

  // Generate summary statistics
  console.log('\nFile structure:')
  console.log(`  - ${numSubdirs} subdirectories`)
  console.log(`  - ${FILES_PER_DIR} files per subdirectory`)
  console.log('\nMessage distribution:')
  MESSAGE_DISTRIBUTION.forEach(({type, weight}) => {
    console.log(`  - ${type}: ${weight}%`)
  })
}

// Run generator
generateFiles().catch(err => {
  console.error('Error generating files:', err)
  process.exit(1)
})
