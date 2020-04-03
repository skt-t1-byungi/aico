export default class AbortError extends Error {
    constructor (msg = 'Aborted') {
        super(msg)
        this.name = 'AbortError'
    }

    get isAborted () {
        return true
    }
}
