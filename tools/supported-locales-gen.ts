import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  cldrFolder: string
  out: string
}

function main(args: Args) {
  console.log(args, '------')
  throw new Error('asd')
}
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
