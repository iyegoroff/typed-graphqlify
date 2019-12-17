'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var GraphQLType;
(function (GraphQLType) {
    GraphQLType[GraphQLType["SCALAR"] = 0] = "SCALAR";
    GraphQLType[GraphQLType["INLINE_FRAGMENT"] = 1] = "INLINE_FRAGMENT";
    GraphQLType[GraphQLType["FRAGMENT"] = 2] = "FRAGMENT";
})(GraphQLType || (GraphQLType = {}));
const typeSymbol = Symbol('GraphQL Type');
const paramsSymbol = Symbol('GraphQL Params');
function isInlineFragmentObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value[typeSymbol] === GraphQLType.INLINE_FRAGMENT);
}
function isFragmentObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value[typeSymbol] === GraphQLType.FRAGMENT);
}
function isScalarObject(value) {
    return (typeof value === 'object' && value !== null && value[typeSymbol] === GraphQLType.SCALAR);
}
function renderName(name) {
    return name === undefined ? '' : name;
}
function renderParams(params, brackets = true) {
    if (!params) {
        return '';
    }
    const builder = [];
    for (const [key, value] of Object.entries(params)) {
        let params;
        if (typeof value === 'object') {
            params = `{${renderParams(value, false)}}`;
        }
        else {
            params = `${value}`;
        }
        builder.push(`${key}:${params}`);
    }
    let built = builder.join(',');
    if (brackets) {
        built = `(${built})`;
    }
    return built;
}
function renderScalar(name, params) {
    return renderName(name) + renderParams(params);
}
function renderInlineFragment(fragment, context) {
    return `...on ${fragment.typeName}${renderObject(undefined, fragment.internal, context)}`;
}
function renderFragment(fragment, context) {
    return `fragment ${fragment.name} on ${fragment.typeName}${renderObject(undefined, fragment.internal, context)}`;
}
function renderArray(name, arr, context) {
    const first = arr[0];
    if (first === undefined || first === null) {
        throw new Error('Cannot render array with no first value');
    }
    first[paramsSymbol] = arr[paramsSymbol];
    return renderType(name, first, context);
}
function renderType(name, value, context) {
    switch (typeof value) {
        case 'bigint':
        case 'boolean':
        case 'number':
        case 'string':
            throw new Error(`Rendering type ${typeof value} directly is disallowed`);
        case 'object':
            if (value === null) {
                throw new Error('Cannot render null');
            }
            if (isScalarObject(value)) {
                return `${renderScalar(name, value[paramsSymbol])} `;
            }
            else if (Array.isArray(value)) {
                return renderArray(name, value, context);
            }
            else {
                return renderObject(name, value, context);
            }
        case 'undefined':
            return '';
        default:
            throw new Error(`Cannot render type ${typeof value}`);
    }
}
function renderObject(name, obj, context) {
    const fields = [];
    for (const [key, value] of Object.entries(obj)) {
        fields.push(renderType(key, value, context));
    }
    for (const sym of Object.getOwnPropertySymbols(obj)) {
        const value = obj[sym];
        if (isInlineFragmentObject(value)) {
            fields.push(renderInlineFragment(value, context));
        }
        else if (isFragmentObject(value)) {
            context.fragments.set(sym, value);
            fields.push(`...${value.name}`);
        }
    }
    if (fields.length === 0) {
        throw new Error('Object cannot have no fields');
    }
    return `${renderName(name)}${renderParams(obj[paramsSymbol])}{${fields.join('').trim()}}`;
}
function render(value) {
    const context = {
        fragments: new Map(),
    };
    let rend = renderObject(undefined, value, context);
    const rendered = new Map();
    let executingContext = context;
    let currentContext = {
        fragments: new Map(),
    };
    while (executingContext.fragments.size > 0) {
        for (const [sym, fragment] of Array.from(executingContext.fragments.entries())) {
            if (!rendered.has(sym)) {
                rendered.set(sym, renderFragment(fragment, currentContext));
            }
        }
        executingContext = currentContext;
        currentContext = {
            fragments: new Map(),
        };
    }
    return rend + Array.from(rendered.values()).join('');
}

function createOperate(operateType) {
    function operate(opNameOrQueryObject, queryObject) {
        if (typeof opNameOrQueryObject === 'string') {
            if (!queryObject) {
                throw new Error('queryObject is not set');
            }
            return `${operateType} ${opNameOrQueryObject}${render(queryObject)}`;
        }
        return `${operateType}${render(opNameOrQueryObject)}`;
    }
    return operate;
}
const query = createOperate('query');
const mutation = createOperate('mutation');
const subscription = createOperate('subscription');
function params(params, input) {
    if (typeof params !== 'object') {
        throw new Error('Params have to be an object');
    }
    if (typeof input !== 'object') {
        throw new Error(`Cannot apply params to JS ${typeof params}`);
    }
    const result = Array.isArray(input) ? [...input] : Object.assign({}, input);
    result[paramsSymbol] = params;
    return result;
}
function alias(alias, target) {
    return `${alias}:${target}`;
}
function fragment(name, typeName, input) {
    const fragment = {
        [typeSymbol]: GraphQLType.FRAGMENT,
        name,
        typeName,
        internal: input,
    };
    return { [Symbol(`Fragment(${name} on ${typeName})`)]: fragment };
}
function rawString(input) {
    return JSON.stringify(input);
}

function optional(obj) {
    return obj;
}
function on(typeName, internal) {
    const fragment = {
        [typeSymbol]: GraphQLType.INLINE_FRAGMENT,
        typeName,
        internal,
    };
    return { [Symbol(`InlineFragment(${typeName})`)]: fragment };
}
function onUnion(types) {
    let fragments = {};
    for (const [typeName, internal] of Object.entries(types)) {
        fragments = Object.assign(Object.assign({}, fragments), on(typeName, internal));
    }
    return fragments;
}
function scalarType() {
    const scalar = {
        [typeSymbol]: GraphQLType.SCALAR,
    };
    return scalar;
}
class types {
    static get number() {
        return scalarType();
    }
    static get string() {
        return scalarType();
    }
    static get boolean() {
        return scalarType();
    }
    static constant(_c) {
        return scalarType();
    }
    static oneOf(_e) {
        return scalarType();
    }
    static custom() {
        return scalarType();
    }
    static or(_t, _u) {
        const tIsNonScalar = _t !== null && Object.getOwnPropertyNames(_t).indexOf('__non_scalar') !== -1;
        const uIsNonScalar = _u !== null && Object.getOwnPropertyNames(_u).indexOf('__non_scalar') !== -1;
        if (tIsNonScalar && uIsNonScalar) {
            throw new Error('Two non scalars not supported!');
        }
        return tIsNonScalar
            ? _t.__non_scalar
            : uIsNonScalar
                ? _u.__non_scalar
                : scalarType();
    }
    static nonScalar(_t) {
        return { __non_scalar: _t };
    }
}
types.optional = types;

exports.fragment = fragment;
exports.params = params;
exports.query = query;
exports.mutation = mutation;
exports.subscription = subscription;
exports.alias = alias;
exports.rawString = rawString;
exports.types = types;
exports.optional = optional;
exports.on = on;
exports.onUnion = onUnion;
//# sourceMappingURL=index.js.map
