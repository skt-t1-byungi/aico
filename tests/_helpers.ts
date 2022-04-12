import { aico } from '../src'

export function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

export function aicoOnlyAbort(cb: () => void) {
    return aico(function* (signal) {
        let resolve: any
        try {
            yield new Promise(r => (resolve = r))
        } finally {
            if (signal.aborted) cb()
            resolve()
        }
    })
}
