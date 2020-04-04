import AbortInCoroutines from './AbortInCoroutines'

export default function <T=any, R=any> (fn: (values: Array<T|PromiseLike<T>>) => PromiseLike<R>) {
    return (values: Array<T|PromiseLike<T>>) => new AbortInCoroutines<R>(function * (signal) {
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
                values.forEach(v => {
                    if (v instanceof AbortInCoroutines && !v.isAborted) v.abort()
                })
            }
        }
    })
}
