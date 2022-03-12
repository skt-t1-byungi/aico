import AbortInCoroutines from './AbortInCoroutines'
import { AicoOptions, GenFunction } from './types'

export default function aico<T>(gen: GenFunction<T>, opts?: AicoOptions) {
    return new AbortInCoroutines(gen, opts)
}
