# AICO
**a**bort **i**n **co**routines

![aico](./aico.jpg)

## Example
```js
import aico from 'aico'

const promise = aico(function * (signal) {
    try {
        const response = yield fetch('/very-slow-api', { signal })
        /* ... */
    } finally {
        if (signal.aborted) {
            console.log('aborted!')
        }
    }
})

setTimeout(() => {
    promise.abort() // => aborted!
}, 100)
```

## Install
```sh
npm install aico
```

## License
MIT
