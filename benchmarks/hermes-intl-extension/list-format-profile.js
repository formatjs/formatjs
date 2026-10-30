const formatter = new Intl.ListFormat('en')
const input = ['one', 'two', 'three']
let last
for (let index = 0; index < 1000000; index++) last = formatter.format(input)
if (last !== 'one, two, and three') throw new Error('List format checksum')
print(last)
