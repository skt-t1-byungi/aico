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

In the generator, `yield` is the same as async function's `await`. Likewise, it waits for promise result. And the generator function parameter `signal` can cancel dom requests such as `fetch`.

```js
const promise = new AbortInCoroutines(function * (signal) {
    const response = yield fetch('/api/request', { signal })
    const json = yield response.json()

    /* ... */
})
```
#### options
##### signal
##### AbortController

### aico(generator)

### promise.abort()

### promise.isAborted

## License
MIT
