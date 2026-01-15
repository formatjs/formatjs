/**
 * CLDR Plural Rules Compiler
 *
 * Implementation: Compiles CLDR plural rules into optimized JavaScript functions.
 * Replaces the make-plural-compiler dependency.
 *
 * CLDR Spec: Unicode CLDR plural rules specification
 * https://unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules
 *
 * Operand symbols (CLDR spec):
 * - n, i, v, w, f, t: Standard operands
 * - c, e: Compact exponent operands (extension for compact notation)
 *
 * Implementation details:
 * - Uses TypeScript AST to generate optimized JavaScript code
 * - Only generates code for operands actually used in rules
 * - Supports exponent parameter (defaults to 0) for c/e operands
 */

import ts from 'typescript'

/**
 * CLDR data structure from cldr-core package
 */
export interface PluralRuleData {
  'plurals-type-cardinal': Record<string, Record<string, string>>
  'plurals-type-ordinal': Record<string, Record<string, string>>
}

/**
 * CLDR Spec: Plural categories
 */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

/**
 * Implementation: Parses a CLDR operand (n, i, v, etc.) with optional modulo into a TypeScript expression
 */
function parseOperand(operandStr: string, modulo?: string): ts.Expression {
  const operand = ts.factory.createIdentifier(operandStr.trim())

  if (modulo) {
    // Extract the divisor from "% 100" format
    const divisor = parseInt(modulo.replace('%', '').trim(), 10)
    return ts.factory.createParenthesizedExpression(
      ts.factory.createBinaryExpression(
        operand,
        ts.SyntaxKind.PercentToken,
        ts.factory.createNumericLiteral(divisor)
      )
    )
  }

  return operand
}

/**
 * Parses a CLDR value part (single value or range) into a TypeScript expression
 * @param operand - The operand expression (e.g., 'n' or '(n % 100)')
 * @param valuePart - The value part (e.g., '1', '3..10')
 * @param isEquals - true for '=', false for '!='
 */
function parseValuePart(
  operand: ts.Expression,
  valuePart: string,
  isEquals: boolean
): ts.Expression {
  valuePart = valuePart.trim()

  if (valuePart.includes('..')) {
    // Range: "3..10" → (n >= 3 && n <= 10)
    const [start, end] = valuePart.split('..').map(s => parseInt(s.trim(), 10))
    const rangeExpr = ts.factory.createBinaryExpression(
      ts.factory.createBinaryExpression(
        operand,
        ts.SyntaxKind.GreaterThanEqualsToken,
        ts.factory.createNumericLiteral(start)
      ),
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.factory.createBinaryExpression(
        operand,
        ts.SyntaxKind.LessThanEqualsToken,
        ts.factory.createNumericLiteral(end)
      )
    )

    if (isEquals) {
      return ts.factory.createParenthesizedExpression(rangeExpr)
    } else {
      // Negate: !(n >= 3 && n <= 10) → (n < 3 || n > 10)
      return ts.factory.createParenthesizedExpression(
        ts.factory.createBinaryExpression(
          ts.factory.createBinaryExpression(
            operand,
            ts.SyntaxKind.LessThanToken,
            ts.factory.createNumericLiteral(start)
          ),
          ts.SyntaxKind.BarBarToken,
          ts.factory.createBinaryExpression(
            operand,
            ts.SyntaxKind.GreaterThanToken,
            ts.factory.createNumericLiteral(end)
          )
        )
      )
    }
  } else {
    // Single value: "1" → n === 1
    const value = parseInt(valuePart, 10)
    return ts.factory.createBinaryExpression(
      operand,
      isEquals
        ? ts.SyntaxKind.EqualsEqualsEqualsToken
        : ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.factory.createNumericLiteral(value)
    )
  }
}

/**
 * Parses a CLDR comparison into a TypeScript expression
 * Examples:
 * - "n = 1" → n === 1
 * - "n % 10 = 3..4,9" → ((n % 10) >= 3 && (n % 10) <= 4) || (n % 10) === 9
 * - "n % 100 != 12..14" → ((n % 100) < 12 || (n % 100) > 14)
 */
function parseComparison(comparisonStr: string): ts.Expression {
  // Pattern: "operand [% divisor] [!]= value[,value]..."
  const pattern = /([nivwftce])\s*(%\s*\d+)?\s*(!=|=)\s*([\d.,]+)/
  const match = comparisonStr.match(pattern)

  if (!match) {
    throw new Error(`Invalid comparison: ${comparisonStr}`)
  }

  const [, operandStr, modulo, op, values] = match
  const isEquals = op === '='
  const operand = parseOperand(operandStr, modulo)

  // Split values by comma
  const valueParts = values.split(',').map(v => v.trim())

  if (valueParts.length === 1) {
    // Single value or range
    return parseValuePart(operand, valueParts[0], isEquals)
  } else {
    // Multiple values/ranges
    const expressions = valueParts.map(part =>
      parseValuePart(operand, part, isEquals)
    )

    // Combine with OR for '=', AND for '!='
    return expressions.reduce((acc, expr) =>
      ts.factory.createParenthesizedExpression(
        ts.factory.createBinaryExpression(
          acc,
          isEquals
            ? ts.SyntaxKind.BarBarToken
            : ts.SyntaxKind.AmpersandAmpersandToken,
          expr
        )
      )
    )
  }
}

/**
 * Parses a CLDR condition string into a TypeScript expression
 */
function parseCondition(condition: string): ts.Expression {
  // Remove sample integers/decimals (everything after @)
  condition = condition.split('@')[0].trim()

  if (!condition) {
    // Empty condition → true
    return ts.factory.createTrue()
  }

  // Split by 'or' first (lower precedence)
  const orParts = condition.split(/\bor\b/).map(s => s.trim())

  if (orParts.length > 1) {
    const expressions = orParts.map(part => {
      // Within each OR part, split by 'and' (higher precedence)
      const andParts = part.split(/\band\b/).map(s => s.trim())

      if (andParts.length > 1) {
        const andExpressions = andParts.map(parseComparison)
        return andExpressions.reduce((acc, expr) =>
          ts.factory.createBinaryExpression(
            acc,
            ts.SyntaxKind.AmpersandAmpersandToken,
            expr
          )
        )
      } else {
        return parseComparison(andParts[0])
      }
    })

    return expressions.reduce((acc, expr) =>
      ts.factory.createBinaryExpression(acc, ts.SyntaxKind.BarBarToken, expr)
    )
  } else {
    // No OR, check for AND
    const andParts = condition.split(/\band\b/).map(s => s.trim())

    if (andParts.length > 1) {
      const expressions = andParts.map(parseComparison)
      return expressions.reduce((acc, expr) =>
        ts.factory.createBinaryExpression(
          acc,
          ts.SyntaxKind.AmpersandAmpersandToken,
          expr
        )
      )
    } else {
      // Single comparison
      return parseComparison(condition)
    }
  }
}

/**
 * Extracts plural category from rule key
 * "pluralRule-count-one" → "one"
 */
function extractCategory(ruleKey: string): PluralCategory {
  const match = ruleKey.match(/pluralRule-count-(.+)/)
  return (match?.[1] as PluralCategory) || 'other'
}

/**
 * Compiles CLDR plural rules into a JavaScript function using TypeScript AST
 */
export class PluralRulesCompiler {
  private cardinalRules: Map<PluralCategory, string> = new Map()
  private ordinalRules: Map<PluralCategory, string> = new Map()

  constructor(
    private locale: string,
    cardinalData?: Record<string, string>,
    ordinalData?: Record<string, string>
  ) {
    if (cardinalData) {
      for (const [ruleKey, condition] of Object.entries(cardinalData)) {
        const category = extractCategory(ruleKey)
        this.cardinalRules.set(category, condition)
      }
    }

    if (ordinalData) {
      for (const [ruleKey, condition] of Object.entries(ordinalData)) {
        const category = extractCategory(ruleKey)
        this.ordinalRules.set(category, condition)
      }
    }
  }

  /**
   * Get available plural categories
   */
  get categories(): {cardinal: PluralCategory[]; ordinal: PluralCategory[]} {
    const cardinalCats = Array.from(this.cardinalRules.keys())
    const ordinalCats = Array.from(this.ordinalRules.keys())

    // Always include 'other' as it's the default
    if (!cardinalCats.includes('other')) {
      cardinalCats.push('other')
    }
    if (!ordinalCats.includes('other')) {
      ordinalCats.push('other')
    }

    return {
      cardinal: cardinalCats.sort(),
      ordinal: ordinalCats.sort(),
    }
  }

  /**
   * Detects which operands are used in the plural rules
   */
  private detectUsedOperands(): Set<string> {
    const used = new Set<string>()

    // Check all conditions in both cardinal and ordinal rules
    const allConditions = [
      ...Array.from(this.cardinalRules.values()),
      ...Array.from(this.ordinalRules.values()),
    ]

    for (const condition of allConditions) {
      // Match operand identifiers (n, i, v, w, f, t, c, e)
      const pattern = /\b([nivwftce])\b/g
      let match: RegExpExecArray | null
      while ((match = pattern.exec(condition)) !== null) {
        used.add(match[1])
      }
    }

    return used
  }

  /**
   * Implementation: Gets operands with their dependencies in the correct order
   * Ensures dependencies are calculated before their dependents
   */
  private getOperandsInOrder(used: Set<string>): Array<[string, string]> {
    // CLDR Spec: Operand definitions
    // https://unicode.org/reports/tr35/tr35-numbers.html#Operands
    // Format: [symbol, JavaScript expression, dependencies]
    const allOperands: Array<[string, string, string[]]> = [
      // CLDR spec: n = absolute value of the source number
      ['n', 'Math.abs(parseFloat(numStr))', []],
      // CLDR spec: i = integer digits of n
      ['i', 'Math.floor(Math.abs(parseFloat(integerPart)))', []],
      // CLDR spec: v = number of visible fraction digits in n, with trailing zeros
      ['v', 'decimalPart.length', []],
      // CLDR spec: w = number of visible fraction digits in n, without trailing zeros
      ['w', 'decimalPart.replace(/0+$/, "").length', []],
      // CLDR spec: f = visible fractional digits in n, with trailing zeros
      ['f', 'v > 0 ? parseInt(decimalPart, 10) : 0', ['v']],
      // CLDR spec: t = visible fractional digits in n, without trailing zeros
      ['t', 'w > 0 ? parseInt(decimalPart.replace(/0+$/, ""), 10) : 0', ['w']],
      // CLDR spec: c = compact decimal exponent (extension for compact notation)
      ['c', 'exponent', []],
      // CLDR spec: e = compact decimal exponent (synonym for c)
      ['e', 'exponent', []],
    ]

    const needed = new Set(used)

    // Add dependencies
    for (const [name, , deps] of allOperands) {
      if (used.has(name)) {
        for (const dep of deps) {
          needed.add(dep)
        }
      }
    }

    // Filter and return operands that are needed
    return allOperands
      .filter(([name]) => needed.has(name))
      .map(([name, expr]) => [name, expr])
  }

  /**
   * Implementation: Compiles CLDR plural rules into a JavaScript function string
   *
   * Uses TypeScript AST to generate optimized code that:
   * 1. Parses the number string (if operands are needed)
   * 2. Calculates only the operands used in the rules
   * 3. Evaluates conditions and returns the appropriate plural category
   *
   * Generated function signature: function(num, isOrdinal, exponent = 0)
   *
   * @returns JavaScript function code as a string
   */
  compile(): string {
    const statements: ts.Statement[] = []

    // Implementation: Only generate code for operands actually used in the rules
    // This reduces generated code size and improves performance
    const usedOperands = this.detectUsedOperands()
    const operands = this.getOperandsInOrder(usedOperands)

    // Only generate parsing code if we actually need operands
    if (operands.length > 0) {
      // Parse number string to extract operands
      statements.push(
        // const numStr = String(num);
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                'numStr',
                undefined,
                undefined,
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier('String'),
                  undefined,
                  [ts.factory.createIdentifier('num')]
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        ),

        // const parts = numStr.split('.');
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                'parts',
                undefined,
                undefined,
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier('numStr'),
                    'split'
                  ),
                  undefined,
                  [ts.factory.createStringLiteral('.')]
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        ),

        // const integerPart = parts[0];
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                'integerPart',
                undefined,
                undefined,
                ts.factory.createElementAccessExpression(
                  ts.factory.createIdentifier('parts'),
                  ts.factory.createNumericLiteral(0)
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        ),

        // const decimalPart = parts[1] || '';
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                'decimalPart',
                undefined,
                undefined,
                ts.factory.createBinaryExpression(
                  ts.factory.createElementAccessExpression(
                    ts.factory.createIdentifier('parts'),
                    ts.factory.createNumericLiteral(1)
                  ),
                  ts.SyntaxKind.BarBarToken,
                  ts.factory.createStringLiteral('')
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        )
      )
    }

    for (const [name] of operands) {
      statements.push(
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                name,
                undefined,
                undefined,
                // Parse the expression string into an AST node
                ts.factory.createIdentifier(`__EXPR_${name}__`)
              ),
            ],
            ts.NodeFlags.Const
          )
        )
      )
    }

    // Build if-else chain for ordinal and cardinal rules
    const cardinalBlock = this.buildRulesBlock(this.cardinalRules)
    const ordinalBlock = this.buildRulesBlock(this.ordinalRules)

    // Only generate if/else when at least one branch has rules
    if (ordinalBlock.length > 0 || cardinalBlock.length > 0) {
      statements.push(
        ts.factory.createIfStatement(
          ts.factory.createIdentifier('isOrdinal'),
          ts.factory.createBlock(ordinalBlock, true),
          ts.factory.createBlock(cardinalBlock, true)
        )
      )
    }

    // return 'other';
    statements.push(
      ts.factory.createReturnStatement(ts.factory.createStringLiteral('other'))
    )

    // Create function declaration
    const func = ts.factory.createFunctionDeclaration(
      undefined,
      undefined,
      'pluralRule',
      undefined,
      [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          'num',
          undefined,
          undefined,
          undefined
        ),
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          'isOrdinal',
          undefined,
          undefined,
          undefined
        ),
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          'exponent',
          undefined,
          undefined,
          ts.factory.createNumericLiteral(0)
        ),
      ],
      undefined,
      ts.factory.createBlock(statements, true)
    )

    // Print to JavaScript source code
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed})
    const sourceFile = ts.createSourceFile(
      'temp.js',
      '',
      ts.ScriptTarget.ES2015,
      false,
      ts.ScriptKind.JS
    )
    let code = printer.printNode(ts.EmitHint.Unspecified, func, sourceFile)

    // Replace placeholder expressions with actual expressions (only for used operands)
    const exprReplacements: Record<string, string> = {}
    for (const [name, expr] of operands) {
      exprReplacements[`__EXPR_${name}__`] = expr
    }

    for (const [placeholder, expr] of Object.entries(exprReplacements)) {
      code = code.replace(placeholder, expr)
    }

    // Convert function declaration to function expression for serialization
    // Change "function pluralRule(...) { ... }" to "function(...) { ... }"
    code = code.replace(/^function\s+pluralRule/, 'function')

    return code
  }

  /**
   * Builds statements for the given rules
   */
  private buildRulesBlock(rules: Map<PluralCategory, string>): ts.Statement[] {
    const statements: ts.Statement[] = []

    // Sort categories to ensure consistent order (but 'other' should be last)
    const categories = Array.from(rules.keys()).filter(c => c !== 'other')
    categories.sort()

    for (const category of categories) {
      const condition = rules.get(category)
      if (condition) {
        try {
          const conditionExpr = parseCondition(condition)
          statements.push(
            ts.factory.createIfStatement(
              conditionExpr,
              ts.factory.createReturnStatement(
                ts.factory.createStringLiteral(category)
              )
            )
          )
        } catch (error) {
          console.warn(
            `Failed to parse condition for ${this.locale}/${category}: ${condition}`,
            error
          )
        }
      }
    }

    return statements
  }
}

/**
 * Loads CLDR plural rules data and creates a compiler
 */
export function loadPluralRules(
  cardinalsData: PluralRuleData['plurals-type-cardinal'],
  ordinalsData: PluralRuleData['plurals-type-ordinal']
): Map<
  string,
  {
    fn: string
    categories: {cardinal: PluralCategory[]; ordinal: PluralCategory[]}
  }
> {
  const compiled = new Map<
    string,
    {
      fn: string
      categories: {cardinal: PluralCategory[]; ordinal: PluralCategory[]}
    }
  >()

  // Get all unique locales
  const locales = new Set([
    ...Object.keys(cardinalsData),
    ...Object.keys(ordinalsData),
  ])

  for (const locale of locales) {
    const cardinalRules = cardinalsData[locale]
    const ordinalRules = ordinalsData[locale]

    const compiler = new PluralRulesCompiler(
      locale,
      cardinalRules,
      ordinalRules
    )

    compiled.set(locale, {
      fn: compiler.compile(),
      categories: compiler.categories,
    })
  }

  return compiled
}
