import { race } from '../src'
import delay from './helpers/delay'
import task from './helpers/task'

test('resolve', async () => {
    const p = race([delay(2).then(() => 1), delay(1).then(() => '2')])
    await expect(p).resolves.toBe('2')
})

test('reject', async () => {
    const p = race([delay(2).then(() => 1), delay(1).then(() => '2'), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
})

test('propagation by abort', async () => {
    const f = jest.fn()
    const p = race([task(f), task(f)])
    p.abort()
    await expect(p).rejects.toThrow('Aborted')
    expect(f.mock.calls.length).toBe(2)
})

test('propagation by reject', async () => {
    const f = jest.fn()
    const p = race([task(f), task(f), Promise.reject(new Error('fail'))])
    await expect(p).rejects.toThrow('fail')
    expect(f.mock.calls.length).toBe(2)
})
