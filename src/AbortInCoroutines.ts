import AbortError from './AbortError'

export type GeneratorExecutor<T> = (signal: AbortSignal) => Generator<any, T>
export type AbortInCoroutinesOptions = { signal?: AbortSignal; unhandledRejection?: boolean }

type OnFulfilled<T, R> = (value: T) => R | PromiseLike<R>
type OnRejected<T = never> = (reason: any) => T | PromiseLike<T>

export default class AbortInCoroutines<T> implements PromiseLike<T> {
    private _ctrl: AbortController | null = null
    private _promise: Promise<T>
    private _isAborted = false

    constructor(
        gen: GeneratorExecutor<T>,
        { signal: optSig, unhandledRejection = false }: AbortInCoroutinesOptions = {}
    ) {
        const p = (this._promise = new Promise((_resolve, _reject) => {
            let cleaners: (() => void)[] | null = []

            function onAbort(sig: AbortSignal, cb: () => void) {
                sig.addEventListener('abort', cb)
                cleaners!.push(() => sig.removeEventListener('abort', cb))
            }

            const cleanup = () => {
                cleaners!.forEach(f => f())
                this._ctrl = cleaners = null
            }
            const resolve = (val: T) => (_resolve(val), cleanup())
            const reject = (err: any) => (_reject(err), cleanup())
            const rejectWithAbort = (msg?: string) => {
                this._isAborted = true
                reject(new AbortError(msg))
            }

            if (optSig) {
                if (optSig.aborted) {
                    return rejectWithAbort('`options.signal` is already aborted.')
                }
                onAbort(optSig, () => this.abort())
            }

            const { signal } = (this._ctrl = new AbortController())
            const iter = gen(signal)

            let pRunning: PromiseLike<any> | null = null
            let done = resolve

            onAbort(signal, () => {
                if (pRunning && pRunning instanceof AbortInCoroutines) pRunning.abort()
                pRunning = null

                done = (val: any) => {
                    if (val === undefined) {
                        rejectWithAbort()
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

            function nextIter(arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.next(arg)
                } catch (err) {
                    return reject(err)
                }
                handle(res)
            }

            function throwIter(arg?: any) {
                let res: IteratorResult<any, T>
                try {
                    res = iter.throw(arg)
                } catch (err) {
                    return reject(err)
                }
                handle(res)
            }

            function handle(res: IteratorResult<any, T>) {
                if (res.done) {
                    return done(res.value)
                }
                if (isThenable(res.value)) {
                    ;(pRunning = res.value).then(
                        val => pRunning === res.value && nextIter(val),
                        err => pRunning === res.value && throwIter(err)
                    )
                } else {
                    nextIter(res.value)
                }
            }

            nextIter()
        }))

        if (!unhandledRejection) {
            p.catch(noop)
        }
    }

    then<TR1 = T, TR2 = never>(onfulfilled?: OnFulfilled<T, TR1> | null, onrejected?: OnRejected<TR2> | null) {
        return this._promise.then(onfulfilled, onrejected)
    }

    catch<TR = never>(onrejected?: OnRejected<TR> | null) {
        return this._promise.catch(onrejected)
    }

    finally(onfinally?: (() => void) | null) {
        return this._promise.finally(onfinally)
    }

    get isAborted() {
        return this._isAborted
    }

    abort(): void {
        this._ctrl?.abort()
    }
}

function isThenable<T>(p: any): p is PromiseLike<T> {
    return p && typeof p.then === 'function'
}

function noop() {}
