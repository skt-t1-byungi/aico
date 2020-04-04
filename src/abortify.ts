import AbortInCoroutines from './AbortInCoroutines'

export default function <V, R> (fn: (values: Array<V|PromiseLike<V>>) => PromiseLike<R>) {
    return (values: Array<V|PromiseLike<V>>) => new AbortInCoroutines<R>(function * (signal) {
        let isErr = false
        try {
            return (yield fn(values).then(
                v => v,
                err => {
                    isErr = true
                    throw err
                })
            ) as R
        } finally {
            if (isErr || signal.aborted) {
                values.forEach(p => {
                    if (p instanceof AbortInCoroutines && !p.isAborted) p.abort()
                })
            }
        }
    })
}
