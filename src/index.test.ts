import { aico } from '.'

test('promiseLike', async () => {
    await expect(aico(function * () { return 1 })).resolves.toBe(1)
    await expect(aico(function * () { throw new Error('err') })).rejects.toThrow()
})

test('yield primitive', async () => {
    await expect(aico(function * () { return (yield 1) as any + 1 })).resolves.toBe(2)
})

test('yield resolved promise', async () => {
    await expect(aico(function * () { return (yield Promise.resolve(1)) as any + 1 })).resolves.toBe(2)
})

test('yield rejected promise', async () => {
    const inputErr = new Error()
    await expect(aico(function * () { yield Promise.reject(inputErr) })).rejects.toThrow(inputErr)
})

test('catch rejected promise', async () => {
    const inputErr = new Error()
    await expect(aico(function * () {
        try {
            yield Promise.reject(inputErr)
        } catch (err) {
            return err
        }
        fail()
    })).resolves.toBe(inputErr)
})

test('yield*', async () => {
    expect.assertions(3)
    function * sub () {
        expect(yield 1).toBe(1) // 1
        expect(yield Promise.resolve(2)).toBe(2) // 2
        return 3
    }
    await expect(aico(function * () { return yield * sub() })).resolves.toBe(3) // 3
})

test('abort, isAborted', async () => {
    const p = aico(function * () { yield Promise.resolve() })
    expect(p.isAborted).toBe(false)
    p.abort()
    expect(p.isAborted).toBe(true)
    await expect(p).rejects.toThrow('Aborted')
})

test('aborted finally', async () => {
    expect.assertions(2)
    const p = aico(function * (signal) {
        try {
            yield Promise.resolve()
            fail()
        } catch {
            fail()
        } finally {
            expect(signal.aborted).toBe(true)
        }
    })
    p.abort()
    await expect(p).rejects.toThrow('Aborted')
})

test('yield after abort', async () => {
    expect.assertions(2)
    const p = aico(function * () {
        try {
            yield Promise.resolve()
        } finally {
            expect(yield 1).toBe(1) // 1
        }
    })
    p.abort()
    await expect(p).rejects.toThrow('Aborted') // 2
})

test('return after abort', async () => {
    const p = aico(function * () {
        try {
            yield Promise.resolve()
            fail()
        } finally {
            // eslint-disable-next-line no-unsafe-finally
            return 1
        }
    })
    p.abort()
    await expect(p).resolves.toBe(1)
})
test('yield and return after abort', async () => {
    const p = aico(function * () {
        try {
            yield Promise.resolve()
            fail()
        } finally {
            expect(yield 1).toBe(1)
            expect(yield Promise.resolve(2)).toBe(2)
            // eslint-disable-next-line no-unsafe-finally
            return 3
        }
    })
    p.abort()
    await expect(p).resolves.toBe(3)
})

test('abort with `opts.signal`', async () => {
    const ctrl = new AbortController()
    const p = aico(function * () { yield Promise.resolve() }, { signal: ctrl.signal })
    expect(p.isAborted).toBe(false)
    ctrl.abort()
    expect(p.isAborted).toBe(true)
    await expect(p).rejects.toThrow('Aborted')
})

test('abort with aborted `opts.signal`', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const p = aico(function * () { fail() }, { signal: ctrl.signal })
    await expect(p).rejects.toThrow('`options.signal` is already abort')
})

test('abort propagation', async () => {
    expect.assertions(5)
    const child = aico(function * (signal) {
        try {
            expect(signal.aborted).toBe(false) // 1
            yield Promise.resolve()
            fail()
        } finally {
            expect(signal.aborted).toBe(true) // 2
        }
    })
    const parent = aico(function * (signal) {
        try {
            expect(signal.aborted).toBe(false) // 3
            yield child
            fail()
        } finally {
            expect(signal.aborted).toBe(true) // 4
        }
    })
    parent.abort()
    await expect(parent).rejects.toThrow('Aborted') // 5
})
