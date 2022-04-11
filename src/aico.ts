import AbortInCoroutines, { AicoOptions, GenFunction } from './AbortInCoroutines'

export default function aico<T>(gen: GenFunction<T>, opts?: AicoOptions) {
    return new AbortInCoroutines(gen, opts)
}
