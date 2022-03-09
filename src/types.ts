export type OnFulfilled<T, R> = (value: T) => R | PromiseLike<R>
export type OnRejected<T = never> = (reason: any) => T | PromiseLike<T>
export type GenFunction<T> = (signal: AbortSignal) => Generator<any, T>
export type AsyncFunction<R> = (...args: any) => PromiseLike<R>
export type AicoOptions = { signal?: AbortSignal; AbortController?: new () => AbortController }
export type AsyncResult<F extends AsyncFunction<any>> = F extends AsyncFunction<infer R> ? R : never
