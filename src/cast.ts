export default function* cast<T>(p: PromiseLike<T>): Generator<PromiseLike<T>, T> {
    return (yield p) as any
}
