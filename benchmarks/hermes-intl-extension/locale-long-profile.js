var tag = 'en-x-abcdefgh'
for (var i = 0; i < 19; i++) tag += '-abcdefgh'
var last
for (var index = 0; index < 100000; index++) last = new Intl.Locale(tag)
if (last.toString() !== tag) throw new Error('Unexpected Locale tag')
print(last.toString())
