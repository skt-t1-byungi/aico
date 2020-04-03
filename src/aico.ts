import AbortInCoroutines from './AbortInCoroutines'
import { AicoOptions, GenFunction } from './types'

export default function aico <T> (genFn: GenFunction<T>, opts?: AicoOptions) {
    return new AbortInCoroutines(genFn, opts)
}
