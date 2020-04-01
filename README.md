# AICO
**a**bort **i**n **co**routines

![aico](./aico.jpg)

## Example
```js
import aico from 'aico'

const promise = aico(function * (signal) {
    try {
        const resp = yield fetch('/very-slow-api', { signal })

        console.log('No print here.')
    } finally {
        if (signal.aborted) {
            console.log('aborted!')
        }
    }
})

promise.catch(err => {
    console.log(`message: ${err.message}`)
    console.log(`isAborted: ${err.isAborted}`)
})

setTimeout(() => {
    promise.abort()
    // => aborted!
    // => message: Aborted
    // => isAborted: true
}, 100)
```

## Install
```sh
npm install aico
```

## API
### new AbortInCoroutines(generator)

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function * (signal) { /* ... */ })
```

### aico(generator)

### promise.abort()

### promise.isAborted

## License
MIT
