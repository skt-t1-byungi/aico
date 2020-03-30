type OnFulfilled<T, R> = (value: T) => R | PromiseLike<R>
type OnRejected<T = never> = (reason: any) => T | PromiseLike<T>
type GenFunction<T> = (signal: AbortSignal) => Generator<any, T>
type Options = {signal?: AbortSignal; AbortController?: new() => AbortController }

declare const global: any
const defaultAbortControllerCtor = (typeof globalThis !== 'undefined' ? globalThis
    : typeof window !== 'undefined' ? window
        : typeof global !== 'undefined' ? global
            : typeof self !== 'undefined' ? self
                : this).AbortController as new() => AbortController

export class AbortError extends Error {
    constructor (reason = 'Aborted') {
        super(reason)
        this.name = 'AbortError'
    }

    get isAborted () {
        return true
    }
}

export default aico

export function aico <T> (genFn: GenFunction<T>, opts?: Options) {
    return new AbortInCoroutines(genFn, opts)
}

export class AbortInCoroutines<T> {
    private _ctrl: AbortController|null = null;
    private _promise: Promise<T>;

    constructor (genFn: GenFunction<T>, { signal, AbortController = defaultAbortControllerCtor }: Options = {}) {
        if (!AbortController) {
            throw new TypeError('`AbortController` polyfill is needed.')
        }
        if (!isGenFn(genFn)) {
            throw new TypeError('Expected `genFn` to be "GeneratorFunction" type.')
        }

        this._promise = new Promise((resolve, reject) => {
            if (signal) {
                if (signal.aborted) {
                    return reject(new AbortError('`options.signal` is already aborted.'))
                }
                onAbort(signal, () => this.abort())
            }

            const internalSignal = (this._ctrl = new AbortController()).signal
            const iter = genFn(internalSignal)
            let pRunning: PromiseLike<any>|null = null

            onAbort(internalSignal, () => {
                if (pRunning && pRunning instanceof AbortInCoroutines) pRunning.abort()
                pRunning = null

                const res = iter.return(undefined as any)
                if (res.done) {
                    reject(new AbortError())
                } else {
                    handleResult(res)
                }
            })

            function iterNext (arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.next(arg)
                } catch (err) {
                    return reject(err)
                }
                handleResult(res)
            }

            function iterThrow (arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.throw(arg)
                } catch (err) {
                    return reject(err)
                }
                handleResult(res)
            }

            function handleResult (res: IteratorResult<any, T>) {
                if (res.done) {
                    resolve(res.value)
                } else {
                    if (isThenable(res.value)) {
                        (pRunning = res.value).then(
                            val => pRunning === res.value && iterNext(val),
                            err => pRunning === res.value && iterThrow(err)
                        )
                    } else {
                        iterNext(res.value)
                    }
                }
            }

            iterNext()
        })

        this._promise.catch(noop) // prevent `unhandledrejection`
    }

    then<TR1=T, TR2=never> (onfulfilled?: OnFulfilled<T, TR1> | null, onrejected?: OnRejected<TR2>|null) {
        return this._promise.then(onfulfilled, onrejected)
    }

    catch<TR=never> (onrejected?: OnRejected<TR> | null) {
        return this._promise.catch(onrejected)
    }

    finally (onfinally?: () => void | null) {
        return this._promise.finally(onfinally)
    }

    get isAborted () {
        return !!this._ctrl?.signal.aborted
    }

    abort (): void {
         this._ctrl?.abort()
    }
}

function noop () {}

function isGenFn (fn: any): fn is GeneratorFunction {
    if (typeof fn !== 'function') return false
    const name = (fn.constructor && fn.constructor.name) || toString.call(fn)
    return name.indexOf('GeneratorFunction') > -1
}

function onAbort (signal: AbortSignal, cb: () => void) {
    signal.addEventListener('abort', function f () {
        signal.removeEventListener('abort', f)
        cb()
    })
}

function isThenable<T> (promise: any): promise is PromiseLike<T> {
    return promise && typeof promise.then === 'function'
}
