import abortify from './abortify'
import AbortInCoroutines from './AbortInCoroutines'

export default abortify(Promise.race) as {
    <T>(values: readonly T[]): AbortInCoroutines<T extends PromiseLike<infer U> ? U : T>;
}
