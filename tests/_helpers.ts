import { aico } from '../src'

export function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

export function task(f: Function) {
    return aico(function* (signal) {
        try {
            yield delay(10)
        } finally {
            if (signal.aborted) f()
        }
    })
}
