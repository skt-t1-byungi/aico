declare const global: any

const defaultAbortControllerCtor = (
    typeof globalThis !== 'undefined'
        ? globalThis
        : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
        ? self
        : this
).AbortController as new () => AbortController

export default defaultAbortControllerCtor
