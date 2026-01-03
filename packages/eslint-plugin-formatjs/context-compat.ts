import type {
  ParserServicesWithoutTypeInformation,
  ParserServicesWithTypeInformation,
} from '@typescript-eslint/utils'
import {type RuleContext} from '@typescript-eslint/utils/ts-eslint'

export const getParserServices = <
  TRuleContext extends RuleContext<string, unknown[]>,
>(
  context: TRuleContext
):
  | Partial<ParserServicesWithoutTypeInformation>
  | Partial<ParserServicesWithTypeInformation>
  | undefined => {
  if (context.parserServices) {
    return context.parserServices
  }

  return context.sourceCode.parserServices
}
