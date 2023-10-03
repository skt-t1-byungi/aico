import AbortInCoroutines from './AbortInCoroutines'

export default function abortify<T = any, R = any>(
    combinator: (values: Iterable<T | PromiseLike<T>>) => PromiseLike<R>,
) {
    return (values: Iterable<T | PromiseLike<T>>) =>
        new AbortInCoroutines<R>(function* (signal) {
            let isErr = false
            try {
                return (yield combinator(values).then(
                    v => v,
                    err => {
                        isErr = true
                        throw err
                    },
                )) as R
            } finally {
                if (isErr || signal.aborted) {
                    for (const p of values) {
                        if (p instanceof AbortInCoroutines && !p.isAborted) {
                            p.abort()
                        }
                    }
                }
            }
        })
}
