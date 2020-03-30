type OnFulfilled<T, R> = (value: T) => R | PromiseLike<R>
type OnRejected<T = never> = (reason: any) => T | PromiseLike<T>
type GenFunction<T> = (signal: AbortSignal) => Generator<any, T>
type AsyncFunction<R> = (...args: any) => PromiseLike<R>
type AicoOptions = {signal?: AbortSignal; AbortController?: new() => AbortController }

export type AsyncResult<F extends AsyncFunction<any>> = F extends AsyncFunction<infer R> ? R : never

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

export function aico <T> (genFn: GenFunction<T>, opts?: AicoOptions) {
    return new AbortInCoroutines(genFn, opts)
}

export class AbortInCoroutines<T> {
    private _ctrl: AbortController|null = null;
    private _promise: Promise<T>;

    constructor (gen: GenFunction<T>, { signal, AbortController = defaultAbortControllerCtor }: AicoOptions = {}) {
        if (!AbortController) {
            throw new TypeError('`AbortController` polyfill(or ponyfill) is needed.')
        }

        this._promise = new Promise((resolve, reject) => {
            if (signal) {
                if (signal.aborted) {
                    return reject(new AbortError('`options.signal` is already aborted.'))
                }
                onAbort(signal, () => this.abort())
            }

            const internalSignal = (this._ctrl = new AbortController()).signal
            const iter = gen(internalSignal)
            let pRunning: PromiseLike<any>|null = null
            let end = resolve

            onAbort(internalSignal, () => {
                if (pRunning && pRunning instanceof AbortInCoroutines) pRunning.abort()
                pRunning = null

                end = (val: any) => {
                    if (val === undefined) {
                        reject(new AbortError())
                    } else {
                        resolve(val)
                    }
                }

                const res = iter.return(undefined as any)
                if (res.done) {
                    end(res.value)
                } else {
                    handle(res)
                }
            })

            function iterNext (arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.next(arg)
                } catch (err) {
                    return reject(err)
                }
                handle(res)
            }

            function iterThrow (arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.throw(arg)
                } catch (err) {
                    return reject(err)
                }
                handle(res)
            }

            function handle (res: IteratorResult<any, T>) {
                if (res.done) {
                    end(res.value)
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

function onAbort (signal: AbortSignal, cb: () => void) {
    signal.addEventListener('abort', function f () {
        signal.removeEventListener('abort', f)
        cb()
    })
}

function isThenable<T> (promise: any): promise is PromiseLike<T> {
    return promise && typeof promise.then === 'function'
}
