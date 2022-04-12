import { test, expect, vi } from 'vitest'
import { all } from '../src'
import { aicoOnlyAbort } from './_helpers'

test('resolve', async () => {
    const p = all([Promise.resolve(1), Promise.resolve('2')])
    await expect(p).resolves.toEqual([1, '2'])
})

test('reject', async () => {
    const p = all([Promise.resolve(1), Promise.resolve('2'), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
})

test('propagation by abort', async () => {
    const f = vi.fn()
    const p = all([aicoOnlyAbort(f), aicoOnlyAbort(f)])
    p.abort()
    await expect(p).rejects.toThrow('Aborted')
    expect(f.mock.calls.length).toBe(2)
})

test('propagation by reject', async () => {
    const f = vi.fn()
    const p = all([aicoOnlyAbort(f), aicoOnlyAbort(f), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
    expect(f.mock.calls.length).toBe(2)
})
