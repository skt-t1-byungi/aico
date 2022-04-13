import AbortInCoroutines, { AbortInCoroutinesOptions, GeneratorExecutor } from './AbortInCoroutines'

export default function aico<T>(gen: GeneratorExecutor<T>, opts?: AbortInCoroutinesOptions) {
    return new AbortInCoroutines(gen, opts)
}
