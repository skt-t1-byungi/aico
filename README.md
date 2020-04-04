# A.I.C.O 🦄

> **A**bort **I**n **CO**routines (promises)

[![npm](https://flat.badgen.net/npm/v/aico)](https://www.npmjs.com/package/aico)
[![npm](https://flat.badgen.net/npm/license/aico)](https://github.com/skt-t1-byungi/aico/blob/master/LICENSE)

`aico` was inspired by redux-saga's [Task cancellation](https://redux-saga.js.org/docs/advanced/TaskCancellation.html). I wanted to use it in promises and found several alternatives. But they are a little bit verbose or lacking. `aico` writes less and does more. It supports [AbortController](https://developer.mozilla.org/docs/Web/API/AbortController) and typescript (but not enough).

![aico](./aico.jpg)

(I enjoyed watching [A.I.C.O](https://www.netflix.com/title/80161848) on Netflix)

## Example
```js
import aico from 'aico'

const promise = aico(function * (signal) {
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
Create an abortable promise using a generator. In a generator, `yield` is the same as async function's `await`. Likewise, wait for a promise result.

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function * () {
    const result = yield asyncTask() // <= result is `{ status: 'complete' }`.

    return result.status
})

promise.then(val => {
    console.log(val) // => complete
})
```

 the parameter `signal` is [AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortSignal) that can cancel DOM requests such as fetch.

```js
const promise = new AbortInCoroutines(function * (signal) {
    const response = yield fetch('/api/request', { signal })

    console.log('This is not printed.')
})

promise.abort() // <= Abort `/api/request` request.
```

`signal` has an `aborted` that indicates whether the promise was aborted or not.

```js
const promise = new AbortInCoroutines(function * (signal) {
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

If the yielded promise is created by `aico`, the abortion is propagated.

```js
const subTask = () => new AbortInCoroutines(function * (signal) {
    try {
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log('subTask is aborted!')
        }
    }
})

const promise = new AbortInCoroutines(function * () {
    yield subTask()
})

promise.abort() // => subTask is aborted!
```


#### options
##### AbortController
This is an option for AbortController [ponyfill](https://github.com/sindresorhus/ponyfill) instead of polyfill. (`aico` uses [AbortController](https://developer.mozilla.org/docs/Web/API/AbortController) internally)

```js
import AbortController from 'abort-controller'

new AbortInCoroutines(function * (signal) { /* ... */ }, { AbortController })
```

##### signal
This is an option to abort a promise with the signal of the external controller.

```js
const controller = new AbortController()

const promise = new AbortInCoroutines(function * (signal) {
    try {
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log('aborted!')
        }
    }
 }, { signal: controller.signal }) // 👈 Here, the external controller's signal is used.

 controller.abort() // => aborted!
```

### aico(generator, options?)
This function can be used instead of the verbose `new AbortInCoroutines()`.

```js
import aico from 'aico'

//or
import { aico } from 'aico'
```

### promise.isAborted
Returns whether the promise is aborted or not.

```js
const promise = new AbortInCoroutines(/* ... */)

console.log(promise.isAborted) // => false

promise.abort()

console.log(promise.isAborted) // => true
```

### promise.abort()
Abort the promise.

### all(values)
This is an abortable [`Promise.all()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).

```js
import { aico, all } from 'aico'

const fetchData = url => aico(function * (signal) {
    try {
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log(`aborted : ${url}`)
        }
    }
})

const promise = all([
    fetchData('/api/1'),
    fetchData('/api/2'),
    fetchData('/api/3')
])

promise.abort()
// => aborted : /api/1
// => aborted : /api/2
// => aborted : /api/3
```

If one is rejected, the other promise created by `aico` is automatically aborted.

```js
const promise = all([
    fetchData('/api/1'),
    fetchData('/api/2'),
    fetchData('/api/3'),
    Promise.reject('fail')
])
// (This is printed immediately)
// => aborted : /api/1
// => aborted : /api/2
// => aborted : /api/3
```

### race(values)
This is an abortable [`Promise.race()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
```js
import { race } from 'aico'

const timeout = ms => new Promise((_, reject) => setTimeout(reject, ms))

const promise = race([
    fetchData('/delay/600'), // <= This api takes 600ms.
    timeout(500)
])

// (After 500ms)
// => aborted : /delay/600
```
Likewise, if one is rejected, the other promise created by aico is automatically aborted.

### abortify(fn)
This function wraps a custom function that handles multiple promises to make it abortable.

```js
import { abortify } from 'aico'

const any = abortify(Promise.any.bind(Promise)) // <= `Promise.any` is experimental and not fully supported.

const promise = any([ /* ... */ ])

promise.abort()
```

## Tips
### Type inference of yielded promise
```js
const promise = aico(function * () {
    const result = yield asyncTask() // <= result type is `any` or `unknown`.

    /* ... */
})
```

In TypeScript, type inference of yielded promise is difficult. So do type assertions explicitly, or using `AsyncResult` helper.

```ts
import { aico, AsyncResult } from 'aico'

const promise = aico(function * () {
    const data = (yield asyncTask()) as { value: string }

    // or
    const data = (yield asyncTask()) as AsyncResult<typeof asyncTask>
})
```

## License
MIT © [skt-t1-byungi](https://github.com/)
