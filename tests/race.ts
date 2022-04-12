import { test, expect, vi } from 'vitest'
import { race } from '../src'
import { delay, aicoOnlyAbort } from './_helpers'

test('resolve', async () => {
    const p = race([delay(2).then(() => 1), delay(1).then(() => '2')])
    await expect(p).resolves.toBe('2')
})

test('reject', async () => {
    const p = race([delay(2).then(() => 1), delay(1).then(() => '2'), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
})

test('propagation by abort', async () => {
    const f = vi.fn()
    const p = race([aicoOnlyAbort(f), aicoOnlyAbort(f)])
    p.abort()
    await expect(p).rejects.toThrow('Aborted')
    expect(f.mock.calls.length).toBe(2)
})

test('propagation by reject', async () => {
    const f = vi.fn()
    const p = race([aicoOnlyAbort(f), aicoOnlyAbort(f), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
    expect(f.mock.calls.length).toBe(2)
})
