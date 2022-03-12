import { aico } from '../src'

export function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

export function aicoOnlyAbort(cb: () => void) {
    return aico(function* (signal) {
        try {
            yield new Promise(() => {})
        } finally {
            if (signal.aborted) cb()
        }
    })
}
