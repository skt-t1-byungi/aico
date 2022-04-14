import { describe, it, expect, vi } from 'vitest'
import { aico, all, any, race } from '../src'
import { setTimeout } from 'node:timers/promises'

describe('all', () => {
    it('resolve', async () => {
        const p = all([Promise.resolve(1), Promise.resolve('2')])
        await expect(p).resolves.toEqual([1, '2'])
    })
    it('reject', async () => {
        const p = all([Promise.resolve(1), Promise.resolve('2'), Promise.reject(new Error('fail'))])
        await expect(p).rejects.toThrow('fail')
    })
    it('propagation by abort', async () => {
        const onAbort = vi.fn()
        const p = all([aicoForAbort(onAbort), aicoForAbort(onAbort)])
        p.abort()
        await expect(p).rejects.toThrow('Aborted')
        expect(onAbort.mock.calls.length).toBe(2)
    })
    it('propagation by reject', async () => {
        const onAbort = vi.fn()
        const p = all([aicoForAbort(onAbort), aicoForAbort(onAbort), Promise.reject(new Error('fail'))])
        await expect(p).rejects.toThrow('fail')
        expect(onAbort.mock.calls.length).toBe(2)
    })
})

describe('race', () => {
    it('resolve', async () => {
        const p = race([setTimeout(10).then(() => 1), setTimeout(1).then(() => '2')])
        await expect(p).resolves.toBe('2')
    })
    it('reject', async () => {
        const p = race([setTimeout(10).then(() => 1), setTimeout(1).then(() => '2'), Promise.reject(new Error('fail'))])
        await expect(p).rejects.toThrow('fail')
    })
    it('propagation by abort', async () => {
        const onAbort = vi.fn()
        const p = race([aicoForAbort(onAbort), aicoForAbort(onAbort)])
        p.abort()
        await expect(p).rejects.toThrow('Aborted')
        expect(onAbort.mock.calls.length).toBe(2)
    })
    it('propagation by reject', async () => {
        const onAbort = vi.fn()
        const p = race([aicoForAbort(onAbort), aicoForAbort(onAbort), Promise.reject(new Error('fail'))])
        await expect(p).rejects.toThrow('fail')
        expect(onAbort.mock.calls.length).toBe(2)
    })
})

describe('any', () => {
    it('resolve', async () => {
        const p = any([setTimeout(10).then(() => 1), setTimeout(1).then(() => '2')])
        await expect(p).resolves.toBe('2')
    })
    it('reject', async () => {
        const p = any([setTimeout(10).then(() => 1), setTimeout(1).then(() => '2'), Promise.reject(new Error('fail'))])
        await expect(p).resolves.toBe('2')
    })
    it('propagation by abort', async () => {
        const onAbort = vi.fn()
        const p = any([aicoForAbort(onAbort), aicoForAbort(onAbort)])
        p.abort()
        await expect(p).rejects.toThrow('Aborted')
        expect(onAbort.mock.calls.length).toBe(2)
    })
})

function aicoForAbort(onAbort: () => void) {
    return aico(function* (signal) {
        let resolve: () => void
        try {
            yield new Promise<void>(r => (resolve = r))
        } finally {
            if (signal.aborted) onAbort()
            resolve()
        }
    })
}
