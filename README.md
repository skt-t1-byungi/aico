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

setTimeout(() => promise.abort(), 150) // <= After 150ms
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
Create a `promise` that can abort asynchronous coroutine. (Define coroutines using `generator`)

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function * (signal) { /* ... */ })

promise.then(/* ... */)
```

In the generator, `yield` is the same as async function's `await`. Likewise, it waits for promise result. And the generator parameter `signal` is [AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortSignal) that can cancel DOM requests such as fetch.

```js
const promise = new AbortInCoroutines(function * (signal) {
    const response = yield fetch('/api/request', { signal })

    const json = yield response.json()

    /* ... */
})
```

Signal also has a `aborted` that indicates whether or not it was aborted in the finally block.

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
 }, { signal: controller.signal }) // 👈 Use the `signal`.

 controller.abort() // => aborted!
```

### aico(generator, options?)
This function can be used instead of the verbose `new AbortInCoroutines()`.

### promise.abort()

### promise.isAborted

## License
MIT
