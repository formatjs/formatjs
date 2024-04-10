// We can't import these types because @glimmer/syntax is ESM
// and our TS is compiled to CJS
// and TSC doesn't know how to ignore the compatibility problems with that
// when we're just doing type impotrs.
// import type {AST} from '@glimmer/syntax'
import {Opts} from '@formatjs/ts-transformer'

function extractText(
  // node: AST.MustacheStatement | AST.SubExpression,
  node: any,
  fileName: string,
  options: Opts
) {
  if (!options.onMsgExtracted) return
  if (!options.overrideIdFn) return

  if (node.path.type !== 'PathExpression') return

  if (['format-message', 'formatMessage'].includes(node.path.original)) {
    let [first, second] = node.params

    if (first.type !== 'StringLiteral') return

    let message = first?.value

    let desc: string | undefined
    if (second?.type === 'StringLiteral') {
      desc = second.value?.trim().replace(/\s+/gm, ' ')
    }

    let defaultMessage = message?.trim().replace(/\s+/gm, ' ')

    let id =
      typeof options.overrideIdFn === 'string'
        ? options.overrideIdFn
        : options.overrideIdFn(undefined, defaultMessage, desc, fileName)

    options.onMsgExtracted(fileName, [
      {
        id: id,
        defaultMessage: defaultMessage,
        description: desc,
      },
    ])
  }
}

export async function parseFile(
  source: string,
  fileName: string,
  options: any
) {
  // ember-template-recast has ESM dependencies (@glimmer/syntax)
  // even though ember-template-recast is usable in CJS environments...
  // TSC doesn't agree.
  //
  // this repo is actually FAKE TS - it's actually compiled to CJS.
  // so any dependency that uses types from an ESM-sub-dependency, must be
  // await imported.
  //
  // Most of the problem is actually an incompatibility between CJS + MJS await imports
  // and jest's poor-support of ESM (mjs extensions).
  // as soon as this repo is off of jest, extract.ts can await import mts files
  // with 0 issue.
  // @ts-ignore
  const {transform} = await (import('ember-template-recast') as any)

  let visitor = function () {
    return {
      // MustacheStatement(node: AST.MustacheStatement) {
      MustacheStatement(node: any) {
        extractText(node, fileName, options)
      },
      // SubExpression(node: AST.SubExpression) {
      SubExpression(node: any) {
        extractText(node, fileName, options)
      },
    }
  }

  // SAFETY: ember-template-recast's types are out of date,
  // but it does not affect runtime
  transform(source, visitor)
}
