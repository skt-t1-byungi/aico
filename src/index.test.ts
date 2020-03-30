import { aico } from '.'

test('promise', async () => {
    await expect(aico(function * () { return 1 })).resolves.toBe(1)
    await expect(aico(function * () { return (yield Promise.resolve(1)) as number + 1 })).resolves.toBe(2)
    // eslint-disable-next-line no-throw-literal
    await expect(aico(function * () { throw 1 })).rejects.toBe(1)
    // eslint-disable-next-line prefer-promise-reject-errors
    await expect(aico(function * () { yield Promise.reject(1) })).rejects.toBe(1)
})
