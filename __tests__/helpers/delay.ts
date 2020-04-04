export default function (ms: number) {
    return new Promise(r => setTimeout(r, ms))
}
