import {RuleContext} from '@typescript-eslint/utils/ts-eslint'

export const getParserServices = <
  TRuleContext extends RuleContext<string, unknown[]>,
>(
  context: TRuleContext
) => {
  if (context.parserServices) {
    return context.parserServices
  }

  return context.sourceCode.parserServices
}
