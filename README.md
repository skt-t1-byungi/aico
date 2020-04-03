# A.I.C.O
> **A**bort **I**n **CO**routines

![aico](./aico.jpg)

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
Create a abortable promise using a generator. In the generator, `yield` is the same as async function's `await`. Likewise, wait for promise result.

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

In addition, `signal` has a `aborted` that indicates whether the promise was aborted or not.

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

#### options
##### AbortController
This is an option for AbortController [ponyfill](https://github.com/sindresorhus/ponyfill) instead of polyfill. (`aico` uses [AbortController](https://developer.mozilla.org/docs/Web/API/AbortController) internally)

```js
import AbortController from 'abort-controller'

new AbortInCoroutines(function * (signal) { /* ... */ }, { AbortController })
```

##### signal
This is an option to abort the coroutine with the signal of the external controller.

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

## Tips
### Abortion propagation
If the yielded promise is created by `aico`, the abortion is propagated.

```js
const subTask = (taskId) => aico(function * (signal) {
    try {
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log('subTask is aborted!')
        }
    }
})

const promise = aico(function * () {
    yield subTask('taskId')
})

promise.abort() // => subTask is aborted!
```

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
MIT
