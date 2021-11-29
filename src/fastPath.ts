import { Doc } from './docBuilder'
import { isNode, getOperatorPrecedence, shouldFlatten } from './utils'

import * as luaparse from 'luaparse'

export type Callback = (path: FastPath) => Doc
export type CallbackForEach = (path: FastPath, index: number) => void
export type CallbackMap = (path: FastPath, index: number) => Doc

export class FastPath {
  private stack: any[]

  public constructor(ast: luaparse.Chunk) {
    this.stack = [ast]
  }

  public getValue() {
    return this.stack[this.stack.length - 1]
  }

  public getNodeAtDepth(depth: number) {
    for (let i = this.stack.length - 1; i >= 0; i -= 2) {
      const value = this.stack[i]

      if (isNode(value) && --depth < 0) {
        return value
      }
    }

    return null
  }

  public getParent(depth: number = 0) {
    return this.getNodeAtDepth(depth + 1)
  }

  public call(callback: Callback, field: string) {
    const node = this.getValue()
    const origLength = this.stack.length

    this.stack.push(field, node[field])
    const result = callback(this)
    this.stack.length = origLength

    return result
  }

  public forEach(callback: CallbackForEach, field: string | null = null) {
    let value = this.getValue()

    const origLength = this.stack.length

    if (field) {
      value = value[field]
      this.stack.push(value)
    }

    for (let i = 0; i < value.length; ++i) {
      this.stack.push(i, value[i])
      callback(this, i)
      this.stack.length -= 2
    }

    this.stack.length = origLength
  }

  public map(callback: (path: FastPath, index: number) => Doc, field: string) {
    const node = this.getValue()[field]

    if (!Array.isArray(node)) {
      return []
    }

    const result: Doc[] = []
    const origLength = this.stack.length

    this.stack.push(field, node)

    node.forEach((val, i) => {
      this.stack.push(i, val)
      result.push(callback(this, i))
      this.stack.length -= 2
    })

    this.stack.length = origLength

    return result
  }

  public needsParens() {
    const parent = this.getParent() as luaparse.Node
    const node = this.getValue() as luaparse.Node

    if (!parent) return false

    switch (node.type) {
      case 'Identifier':
      case 'IndexExpression':
      case 'MemberExpression':
        return false

      // Todo: check if there are cases where these need parens.
      case 'CallExpression':
      case 'VarargLiteral':
      case 'TableCallExpression':
        return false

      case 'StringCallExpression':
        if (parent.type === 'TableValue') {
          return true
        } else if (parent.type === 'ReturnStatement') {
          return !(parent.arguments.indexOf(node) < parent.arguments.length - 1)
        } else if (
          parent.type === 'LocalStatement' ||
          parent.type === 'AssignmentStatement'
        ) {
          if (parent.variables.length <= parent.init.length) {
            return false
          }

          return !(parent.init.indexOf(node) < parent.init.length - 1)
        }

        return false

      case 'UnaryExpression':
        switch (parent.type) {
          case 'UnaryExpression':
            return (
              node.operator === parent.operator &&
              (node.operator === '+' || node.operator === '-')
            )
          case 'BinaryExpression':
            return parent.operator === '^' && parent.left === node
          default:
            return false
        }

      case 'BooleanLiteral':
      case 'NilLiteral':
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'TableConstructorExpression':
      case 'FunctionDeclaration':
        return (
          (parent.type === 'CallExpression' ||
            parent.type === 'MemberExpression' ||
            parent.type === 'IndexExpression' ||
            parent.type === 'TableCallExpression' ||
            parent.type === 'StringCallExpression') &&
          parent.base === node
        )

      case 'LogicalExpression':
      case 'BinaryExpression':
        switch (parent.type) {
          case 'UnaryExpression':
            return true
          case 'CallExpression':
            return true
          case 'BinaryExpression':
          case 'LogicalExpression':
            const nodePrecedence = getOperatorPrecedence(node.operator)
            const parentPrecedence = getOperatorPrecedence(parent.operator)

            if (parentPrecedence > nodePrecedence) {
              return true
            }

            if (parent.operator === 'or' && node.operator === 'and') {
              return true
            }

            const haveSamePrecedence = parentPrecedence === nodePrecedence
            const haveSameOperator = parent.operator === node.operator
            const isLeft = parent.left === node
            if (haveSamePrecedence && !haveSameOperator && isLeft) {
              return true
            }

            if (
              haveSamePrecedence &&
              !shouldFlatten(node.operator, parent.operator)
            ) {
              return true
            }
        }
        return false
    }

    return false
  }
}
