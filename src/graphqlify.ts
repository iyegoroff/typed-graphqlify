import { GraphQLFragment, GraphQLType, Params, paramsSymbol, render, typeSymbol } from './render'

interface QueryObject {
  [x: string]: any
}

function createOperate(operateType: string) {
  function operate(queryObject: QueryObject): string
  function operate(operationName: string, queryObject: QueryObject): string
  function operate(opNameOrQueryObject: string | QueryObject, queryObject?: QueryObject): string {
    if (typeof opNameOrQueryObject === 'string') {
      if (!queryObject) {
        throw new Error('queryObject is not set')
      }
      return `${operateType} ${opNameOrQueryObject}${render(queryObject)}`
    }
    return `${operateType}${render(opNameOrQueryObject)}`
  }
  return operate
}

export const query = createOperate('query')
export const mutation = createOperate('mutation')
export const subscription = createOperate('subscription')

export function params<T>(params: Params, input: T): T {
  if (typeof params !== 'object') {
    throw new Error('Params have to be an object')
  }
  if (typeof input !== 'object') {
    throw new Error(`Cannot apply params to JS ${typeof params}`)
  }

  const result = Array.isArray(input) ? [...input] : { ...input }
  ;(result as any)[paramsSymbol] = params
  return result as any
}

export function alias<T extends string>(alias: T, target: string): T {
  return `${alias}:${target}` as T
}

export function fragment<T extends Record<string, unknown>>(
  name: string,
  typeName: string,
  input: T,
): T {
  const fragment: GraphQLFragment = {
    [typeSymbol]: GraphQLType.FRAGMENT,
    name,
    typeName,
    internal: input,
  }

  return { [Symbol(`Fragment(${name} on ${typeName})`)]: fragment } as any
}

/**
 * prevent `String` param being rendered as enum
 */
export function rawString(input: string) {
  return JSON.stringify(input)
}
