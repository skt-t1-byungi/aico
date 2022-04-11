import abortify from './abortify'
import AbortInCoroutines from './AbortInCoroutines'

export const all = abortify(Promise.all.bind(Promise)) as <T extends readonly unknown[] | []>(
    values: T
) => AbortInCoroutines<{ -readonly [P in keyof T]: Awaited<T[P]> }>

export const race = abortify(Promise.race.bind(Promise)) as <T extends readonly unknown[] | []>(
    values: T
) => AbortInCoroutines<Awaited<T[number]>>

export const any = abortify(Promise.any.bind(Promise)) as <T extends readonly unknown[] | []>(
    values: T
) => AbortInCoroutines<Awaited<T[number]>>

export const allSettled = abortify(Promise.allSettled.bind(Promise)) as <T extends readonly unknown[] | []>(
    values: T
) => AbortInCoroutines<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>> }>
