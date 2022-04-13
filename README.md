# A.I.C.O 🦄

> **A**bort **I**n **CO**routines (promises)

[![npm](https://flat.badgen.net/npm/v/aico)](https://www.npmjs.com/package/aico)
[![npm](https://flat.badgen.net/npm/license/aico)](https://github.com/skt-t1-byungi/aico/blob/master/LICENSE)

`aico` was inspired by redux-saga's [Task cancellation](https://redux-saga.js.org/docs/advanced/TaskCancellation.html). I wanted to use it in promises and found several alternatives. But they are a little bit verbose or lacking. `aico` writes less and does more. And it supports [AbortController](https://developer.mozilla.org/docs/Web/API/AbortController) and typescript.

![aico](./aico.jpg)

(I enjoyed watching [A.I.C.O](https://www.netflix.com/title/80161848) on Netflix)

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
    console.log(`4. message: ${err.message}`)
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
4. message: Aborted
5. isAborted: true
```

## Install

```sh
npm install aico
```

## API

### new AbortInCoroutines(generator, options?)

Create an abortable promise using a generator. In a generator, `yield` is the same as async function's `await`.

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function* (signal) {
    const result = yield Promise.resolve('hello') // <= result is "hello".

    return result
})

promise.then(val => {
    console.log(val) // => "hello"
})
```

`signal` parameter is [AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortSignal) that can cancel DOM requests such as fetch.

```js
const promise = new AbortInCoroutines(function* (signal) {
    const response = yield fetch('/api/request', { signal })

    console.log('This is not printed.')
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
        } else {
            console.log('not aborted.')
        }
    }
})

promise.abort() // => aborted!
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

promise.abort() // => subTask is aborted!
```

#### options

##### signal

This is an option to abort a promise with the signal of the external controller.

```js
const controller = new AbortController()

const promise = new AbortInCoroutines(
    function* (signal) {
        try {
            /* ... */
        } finally {
            if (signal.aborted) {
                console.log('aborted!')
            }
        }
    },
    {
        signal: controller.signal, // 👈 Here, the external controller's signal is used.
    }
)

controller.abort() // => aborted!
```

##### unhandledRejection

If there is no catch handler registered when this is `true`, an `unhandledRejection` occurs. Default is `false`.

```js
new AbortInCoroutines(
    function* () {
        /* ... */
    },
    {
        unhandledRejection: true,
    }
).abort()
// => `unhandledRejection` warning is printed.
```

#### promise.isAborted

Returns whether the promise is aborted or not.

```js
const promise = new AbortInCoroutines(/* ... */)

console.log(promise.isAborted) // => false

promise.abort()

console.log(promise.isAborted) // => true
```

#### promise.abort()

Abort the promise.

### aico(generator, options?)

This function can be used instead of the verbose `new AbortInCoroutines()`.

```js
import { aico } from 'aico'

const promise = aico(function* (signal) {
    /* ... */
})
```

### Combinators

#### all(values)

This is an abortable [`Promise.all()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

```js
import { aico, all } from 'aico'

const fetchData = url =>
    aico(function* (signal) {
        try {
            /* ... */
        } finally {
            if (signal.aborted) {
                console.log(`aborted : ${url}`)
            }
        }
    })

const promise = all([fetchData('/api/1'), fetchData('/api/2'), fetchData('/api/3')])

promise.abort()
// => aborted : /api/1
// => aborted : /api/2
// => aborted : /api/3
```

If one is rejected, the other promise created by `aico` is automatically aborted.

```js
const promise = all([fetchData('/api/1'), fetchData('/api/2'), fetchData('/api/3'), Promise.reject('fail')])
// (This is printed immediately)
// => aborted : /api/1
// => aborted : /api/2
// => aborted : /api/3
```

#### race(values)

This is an abortable [`Promise.race()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).

```js
import { race } from 'aico'

const timeout = ms => new Promise((_, reject) => setTimeout(reject, ms))

const promise = race([
    fetchData('/delay/600'), // <= This api takes 600ms.
    timeout(500),
])

// (After 500ms)
// => aborted : /delay/600
```

Likewise, if one is rejected, the other promise created by aico is automatically aborted.

#### any(values)

This is an abortable [`Promise.any()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/any).

#### allSettled(values)

This is an abortable [`Promise.allSettled()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).

### cast(promise)

In TypeScript, type inference of yielded promise is difficult. So do type assertions explicitly.

```ts
import { aico, cast } from 'aico'

const promise = aico(function* () {
    const data = (yield asyncTask()) as { value: string }

    // or
    const data = (yield asyncTask()) as Awaited<ReturnType<typeof asyncTask>>
})
```

Or a `cast` function and `yield*` combination, type inference is possible without type assertion.

```ts
import { aico, cast } from 'aico'

const promise = aico(function* () {
    const data = yield* cast(asyncTask())
})
```

## License

MIT © [skt-t1-byungi](https://github.com/)
