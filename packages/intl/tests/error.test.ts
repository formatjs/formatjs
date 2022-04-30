import {MissingTranslationError} from '../src/error'

describe('MissingTranslationError', () => {
  it('records the actual default message', () => {
    const e = new MissingTranslationError(
      {defaultMessage: 'some message'},
      'en'
    )
    expect(e.toString()).toMatch(/default message \(some message\)/)
  })

  it('records the actual default message for MessageFormatElement[]', () => {
    // this works for all `MessageFormatElement` except for `PoundElement`
    const e = new MissingTranslationError(
      {defaultMessage: [{type: 0, value: 'some message'}]},
      'en'
    )
    expect(e.toString()).toMatch(/default message \(some message\)/)
  })

  it('records the actual default message for PoundElement[]', () => {
    const e = new MissingTranslationError({defaultMessage: [{type: 7}]}, 'en')
    expect(e.toString()).toMatch(/default message \(\{"type":7\}\)/)
  })
})
