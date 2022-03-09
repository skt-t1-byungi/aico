import abortify from './abortify'
import AbortInCoroutines from './AbortInCoroutines'

export default abortify(Promise.race.bind(Promise)) as {
    <T>(values: T[]): AbortInCoroutines<T extends PromiseLike<infer U> ? U : T>
}
