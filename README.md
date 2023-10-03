# A.I.C.O 🦄

> **A**bort **I**n **CO**routines (promise)

[![npm](https://flat.badgen.net/npm/v/aico)](https://www.npmjs.com/package/aico)
[![npm](https://flat.badgen.net/npm/license/aico)](https://github.com/skt-t1-byungi/aico/blob/master/LICENSE)

Inspired by Redux-Saga's [Task cancellation](https://redux-saga.js.org/docs/advanced/TaskCancellation.html), aico is designed to make promise cancellation simpler and more efficient. With a minimalist API, it integrates seamlessly with [AbortController](https://developer.mozilla.org/docs/Web/API/AbortController) and TypeScript.

![aico](./aico.jpg)

(Title inspired by the Netflix series [A.I.C.O](https://www.netflix.com/title/80161848) on Netflix))

## Example

```js
import { aico } from 'aico'

const promise = aico(function* (signal) {
    try {
        yield fetch('/delay/100', { signal }) // <= This api takes 100ms.
        console.log('1. This is printed.')

        yield fetch('/delay/100', { signal }) // <= This api takes 100ms.
        console.log('2. This is not printed.')
    } finally {
        if (signal.aborted) {
            console.log('3. aborted!')
        }
    }
})

promise.catch(err => {
    console.log(`4. message: ${err.name}`)
    console.log(`5. isAborted: ${err.isAborted}`)
})

setTimeout(() => {
    promise.abort() // <= After 150ms
}, 150)
```

```
> output
1. This is printed.
3. aborted!
4. message: AbortError
5. isAborted: true
```

## Install

```sh
npm install aico
```

## API

### new AbortInCoroutines(generator, options?)

Creates an abortable promise. Within the generator function, the `yield` statement behaves like `await` in an async function.

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function* (signal) {
    const result = yield Promise.resolve('hello')
    return result
})
```

`signal` parameter is [AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortSignal) that can cancel DOM requests such as fetch.

```js
const promise = new AbortInCoroutines(function* (signal) {
    const response = yield fetch('/api/request', { signal })
    // ...
})

promise.abort() // <= Abort `/api/request` request.
```

`signal` has an `aborted` property that indicates whether the promise was aborted or not.

```js
const promise = new AbortInCoroutines(function* (signal) {
    try {
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log('aborted!')
        }
    }
})

promise.abort() // => "aborted!"
```

If the yielded promise was created with `AbortInCoroutines`, the cancellation is propagated.

```js
const subTask = () =>
    new AbortInCoroutines(function* (signal) {
        try {
            /* ... */
        } finally {
            if (signal.aborted) {
                console.log('subTask is aborted!')
            }
        }
    })

const promise = new AbortInCoroutines(function* () {
    yield subTask()
})

promise.abort() // => "subTask is aborted!"
```

#### options

##### signal

Allows for aborting the promise using an external AbortController signal.

```js
const controller = new AbortController()

const promise = new AbortInCoroutines(
    function* (signal) {
        /* ... */
    },
    {
        signal: controller.signal,
    },
)

controller.abort()
```

##### unhandledRejection

If set to `true`, an unhandledRejection occurs. Default is `false`.

```js
new AbortInCoroutines(
    function* () {
        /* ... */
    },
    {
        unhandledRejection: true,
    },
).abort()
```

#### promise.isAborted

Checks if the promise has been aborted.

```js
console.log(promise.isAborted) // => false

promise.abort()

console.log(promise.isAborted) // => true
```

#### promise.abort()

Abort the promise manually.

### aico(generator, options?)

A shorthand function as an alternative to `new AbortInCoroutines()`.

```js
import { aico } from 'aico'

const promise = aico(function* (signal) {
    /* ... */
})
```

### Combinators

#### all(values)

An abortable version of [`Promise.all()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/all). If one promise rejects, all other promises are automatically aborted.

#### race(values)

An abortable version of [`Promise.race()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/race). If one promise rejects, all other promises are automatically aborted.

#### any(values)

An abortable version of [`Promise.any()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/any).

#### allSettled(values)

An abortable version of [`Promise.allSettled()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).

### cast(promise)

When working with TypeScript, you may find type inference challenging for yielded promises.

```ts
import { aico, cast } from 'aico'

const promise = aico(function* () {
    const data = (yield fetchData()) as { value: string }

    // or
    const data = (yield fetchData()) as Awaited<ReturnType<typeof fetchData>>
})
```

Use `cast` for better type inference.

```ts
import { aico, cast } from 'aico'

const promise = aico(function* () {
    const data = yield* cast(fetchData())
})
```

## License

MIT © [skt-t1-byungi](https://github.com/)
