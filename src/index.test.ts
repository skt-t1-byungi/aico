import { aico } from '.'

test('promiseLike', async () => {
    await expect(aico(function * () { return 1 })).resolves.toBe(1)
    await expect(aico(function * () { throw new Error('err') })).rejects.toThrow()
})

test('handle yielded value', async () => {
    await expect(aico(function * () {
        return yield 1
    })).resolves.toBe(1)

    await expect(aico(function * () {
        return (yield Promise.resolve(1)) as any + 1
    })).resolves.toBe(2)

    await expect(aico(function * () {
        yield Promise.reject(new Error('testErr'))
    })).rejects.toThrow('testErr')

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

test('yield after aborted', async () => {
    const p1 = aico(function * () {
        try {
            yield Promise.resolve()
        } finally {
            yield 1
        }
    })
    p1.abort()
    await expect(p1).rejects.toThrow('Aborted')

    const p2 = aico(function * () {
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
    p2.abort()
    await expect(p2).resolves.toBe(3)
})

test('abort with `opts.signal`', async () => {
    const ctrl = new AbortController()
    const p = aico(function * () { yield Promise.resolve() }, { signal: ctrl.signal })
    expect(p.isAborted).toBe(false)
    ctrl.abort()
    expect(p.isAborted).toBe(true)
    await expect(p).rejects.toThrow('Aborted')
})

test('abort with aborted `opts.siganl`', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const p = aico(function * () { fail() }, { signal: ctrl.signal })
    await expect(p).rejects.toThrow('`options.signal` is already abort')
})

test('abort propagation', async () => {
    expect.assertions(3)
    const child = aico(function * (signal) {
        try {
            yield Promise.resolve()
        } finally {
            expect(signal.aborted).toBe(true) // 1
        }
    })
    const parent = aico(function * (signal) {
        try {
            yield child
        } finally {
            expect(signal.aborted).toBe(true) // 2
        }
    })
    parent.abort()
    await expect(parent).rejects.toThrow('Aborted') // 3
})
