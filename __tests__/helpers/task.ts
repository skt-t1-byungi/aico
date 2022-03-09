import aico from '../../src'
import delay from './delay'

export default (f: Function) =>
    aico(function* (signal) {
        try {
            yield delay(10)
        } finally {
            if (signal.aborted) f()
        }
    })
