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
    private _isAborted = false

    constructor (gen: GenFunction<T>, { signal: inSignal, AbortController = defaultAbortControllerCtor }: AicoOptions = {}) {
        if (!AbortController) {
            throw new TypeError('`AbortController` polyfill(or ponyfill) is needed.')
        }

        this._promise = new Promise((_resolve, _reject) => {
            let offs: Array<() => void>|null = []
            const on = (s: AbortSignal, cb: () => void) => {
                s.addEventListener('abort', cb)
                offs!.push(() => s.removeEventListener('abort', cb))
            }
            const cleanup = () => {
                offs!.forEach(off => off())
                offs = null
                this._ctrl = null
            }
            const resolve = (val: T) => (_resolve(val), cleanup())
            const reject = (err: Error) => (_reject(err), cleanup())
            const abort = (reason?: string) => {
                this._isAborted = true
                reject(new AbortError(reason))
            }

            if (inSignal) {
                if (inSignal.aborted) {
                    return abort('`options.signal` is already aborted.')
                }
                on(inSignal, () => this.abort())
            }

            const { signal } = this._ctrl = new AbortController()
            const iter = gen(signal)

            let pRunning: PromiseLike<any>|null = null
            let done = resolve

            on(signal, () => {
                if (pRunning && pRunning instanceof AbortInCoroutines) pRunning.abort()
                pRunning = null

                done = (val: any) => {
                    if (val === undefined) {
                        abort()
                    } else {
                        resolve(val)
                    }
                }

                const res = iter.return(undefined as any)
                if (res.done) {
                    done(res.value)
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
                    done(res.value)
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
        return this._isAborted
    }

    abort (): void {
         this._ctrl?.abort()
    }
}

function noop () {}

function isThenable<T> (promise: any): promise is PromiseLike<T> {
    return promise && typeof promise.then === 'function'
}
