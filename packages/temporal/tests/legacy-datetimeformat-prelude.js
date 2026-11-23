// Exercise the legacy adapter with Hermes' native formatter primitives.
if (typeof Intl.DateTimeFormat.__formatTemporal !== 'function')
  throw new Error('Native formatter bridge missing')
delete Intl.DateTimeFormat.__formatTemporal
