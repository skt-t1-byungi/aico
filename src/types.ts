export type OnFulfilled<T, R> = (value: T) => R|PromiseLike<R>
export type OnRejected<T = never> = (reason: any) => T|PromiseLike<T>
export type GenFunction<T> = (signal: AbortSignal) => Generator<any, T>
export type AsyncFunction<R> = (...args: any) => PromiseLike<R>
export type PromisesHandler<T, R> = (promises: PromiseLike<T>) => PromiseLike<R>
export type AicoOptions = {signal?: AbortSignal; AbortController?: new() => AbortController}
