# AICO
**a**bort **i**n **co**routines

![aico](./aico.jpg)

## Example
```js
import aico from 'aico'

const promise = aico(function * (signal) {
    try {
        const response = yield fetch('/very-slow-api', { signal })

        console.log('No print here.')
    } finally {
        if (signal.aborted) {
            console.log('aborted!')
        }
    }
})

setTimeout(() => {
    promise.abort() // => aborted!
}, 50)
```

## Install
```sh
npm install aico
```

## API
### new AbortInCoroutines(generator)

```js
import { AbortInCoroutines } from 'aico'

const promise = new AbortInCoroutines(function * (signal) {
    /* ... */
})
```

### promise.abort()

### promise.isAborted

## License
MIT
