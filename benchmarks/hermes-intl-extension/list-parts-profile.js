const formatter = new Intl.ListFormat('en')
const input = ['one', 'two', 'three']
let last
for (let index = 0; index < 300000; index++)
  last = formatter.formatToParts(input)
if (
  last.length !== 5 ||
  last.map(part => part.value).join('') !== 'one, two, and three'
)
  throw new Error('List parts checksum')
print(last.length)
