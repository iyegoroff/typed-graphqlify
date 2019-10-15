import { typeSymbol, GraphQLType, GraphQLScalar, GraphQLInlineFragment } from './render'

// Utility type
type ValueOf<T> = T[keyof T]

export function optional<T>(obj: T): T | undefined {
  return obj
}

export function on<T extends {}>(typeName: string, internal: T): Partial<T> {
  const fragment: GraphQLInlineFragment = {
    [typeSymbol]: GraphQLType.INLINE_FRAGMENT,
    typeName,
    internal,
  }
  return { [Symbol(`InlineFragment(${typeName})`)]: fragment } as any
}

export function onUnion<T>(types: Record<string, T>): T {
  let fragments: Record<any, T> = {}
  for (const [typeName, internal] of Object.entries(types)) {
    fragments = {
      ...fragments,
      ...on(typeName, internal),
    }
  }
  return fragments as any
}

function scalarType(): any {
  const scalar: GraphQLScalar = {
    [typeSymbol]: GraphQLType.SCALAR,
  }
  return scalar
}

export class types {
  static get number(): number {
    return scalarType()
  }

  static get string(): string {
    return scalarType()
  }

  static get boolean(): boolean {
    return scalarType()
  }

  static constant<T extends string>(_c: T): T {
    return scalarType()
  }

  static oneOf<T extends {}>(_e: T): ValueOf<T> {
    return scalarType()
  }

  static custom<T>(): T {
    return scalarType()
  }

  static or<T, U>(_t: T, _u: U): T | U {
    const tIsNonScalar =
      _t !== null && Object.getOwnPropertyNames(_t).indexOf('__non_scalar') !== -1
    const uIsNonScalar =
      _u !== null && Object.getOwnPropertyNames(_u).indexOf('__non_scalar') !== -1
    if (tIsNonScalar && uIsNonScalar) {
      throw new Error('Two non scalars not supported!')
    }

    return tIsNonScalar ? _t : uIsNonScalar ? _u : scalarType()
  }

  static nonScalar<T>(_t: T): T {
    return { __non_scalar: _t } as any
  }

  static optional: {
    number?: number
    string?: string
    boolean?: boolean
    constant: <T extends string>(_c: T) => T | undefined
    oneOf: <T extends {}>(_e: T) => (ValueOf<T>) | undefined
    custom: <T>() => T | undefined
    or: <T, U>(_t: T, _u: U) => T | U | undefined
  } = types
}
