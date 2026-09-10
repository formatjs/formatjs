import {useId, useState, type ReactNode} from 'react'
import {useEditorDesignSystem} from '#packages/editor/design-system.js'

export interface LocalePickerLabels {
  title: string
  empty: string
  clear: string
  selectAll: (count: number) => string
  selected: (count: number) => string
  trigger: (summary: string) => string
}
export interface LocalePickerProps {
  locales: readonly string[]
  selectedLocales: readonly string[]
  /** Reports unique available locales in their input order; never mutates selection. */
  onChange: (locales: string[]) => void
  /** Defaults to the locale code; consumers choose the display language. */
  getLocaleLabel?: (locale: string) => string
  labels?: Partial<LocalePickerLabels>
}
const defaults: LocalePickerLabels = {
  title: 'Locales',
  empty: 'No locales selected',
  clear: 'Clear',
  selectAll: count =>
    `Select all ${count} ${count === 1 ? 'locale' : 'locales'}`,
  selected: count => `${count} locales selected`,
  trigger: summary => `Locales: ${summary}`,
}
const localeCode = (locale: string): string => locale

export function LocalePicker({
  locales,
  selectedLocales,
  onChange,
  getLocaleLabel = localeCode,
  labels,
}: LocalePickerProps): ReactNode {
  const {Checkbox, Button, LocalePickerLayout} = useEditorDesignSystem()
  const id = useId()
  const [open, setOpen] = useState(false)
  const available = [...new Set(locales)]
  const selected = new Set(selectedLocales)
  const active = available.filter(locale => selected.has(locale))
  const text = {...defaults, ...labels}
  const summary =
    active.length === 0
      ? text.empty
      : active.length === 1
        ? getLocaleLabel(active[0]!)
        : text.selected(active.length)
  const all = available.length > 0 && active.length === available.length
  const midpoint = Math.ceil(available.length / 2)
  const columns = [available.slice(0, midpoint), available.slice(midpoint)]
  return (
    <LocalePickerLayout
      id={id}
      title={text.title}
      summary={summary}
      triggerLabel={text.trigger(summary)}
      open={open}
      onOpenChange={setOpen}
      controls={
        <div>
          <label htmlFor={`${id}-all`}>
            <Checkbox
              id={`${id}-all`}
              disabled={available.length === 0}
              checked={all ? true : active.length ? 'indeterminate' : false}
              onCheckedChange={checked => onChange(checked ? available : [])}
            />
            {text.selectAll(available.length)}
          </label>
          <Button
            variant="secondary"
            disabled={active.length === 0}
            onPress={() => onChange([])}
          >
            {text.clear}
          </Button>
        </div>
      }
      columns={columns.map((column, columnIndex) =>
        column.map((locale, index) => {
          const checkboxId = `${id}-${columnIndex}-${index}`
          return (
            <label
              key={locale}
              htmlFor={checkboxId}
              style={{display: 'flex', alignItems: 'center', gap: 8}}
            >
              <Checkbox
                id={checkboxId}
                checked={selected.has(locale)}
                onCheckedChange={checked =>
                  onChange(
                    available.filter(candidate =>
                      candidate === locale ? checked : selected.has(candidate)
                    )
                  )
                }
              />
              {getLocaleLabel(locale)}
            </label>
          )
        })
      )}
    />
  )
}
