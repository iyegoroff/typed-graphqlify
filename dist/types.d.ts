declare type ValueOf<T> = T[keyof T];
export declare function optional<T>(obj: T): T | undefined;
export declare function on<T extends {}>(typeName: string, internal: T): Partial<T>;
export declare function onUnion<T>(types: Record<string, T>): T;
export declare class types {
    static readonly number: number;
    static readonly string: string;
    static readonly boolean: boolean;
    static constant<T extends string>(_c: T): T;
    static oneOf<T extends {}>(_e: T): ValueOf<T>;
    static custom<T>(): T;
    static or<T, U>(_t: T, _u: U): T | U;
    static nonScalar<T>(_t: T): T;
    static optional: {
        number?: number;
        string?: string;
        boolean?: boolean;
        constant: <T extends string>(_c: T) => T | undefined;
        oneOf: <T extends {}>(_e: T) => (ValueOf<T>) | undefined;
        custom: <T>() => T | undefined;
        or: <T, U>(_t: T, _u: U) => T | U | undefined;
    };
}
export {};
