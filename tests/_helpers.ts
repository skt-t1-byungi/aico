import { aico } from '../src'

export function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

export function aicoOnlyAbort(cb: () => void) {
    return aico(function* (signal) {
        let r: any
        try {
            yield new Promise(_r => (r = _r))
        } finally {
            if (signal.aborted) cb()
            r()
        }
    })
}
