export function _stack() {
    const err = new Error
    return err.stack!.split('\n')
}
export function _filename() {
    const caller_line = _caller_line()
    return caller_line.slice(0 + 1, caller_line.indexOf(':'))
}
export function _line() {
    const caller_line = _caller_line()
    return parseInt(caller_line.slice(caller_line.indexOf(':') + 1, caller_line.lastIndexOf(':')))
}
export function _line_pos() {
    const caller_line = _caller_line()
    return caller_line.slice(caller_line.lastIndexOf(':') + 1)
}
export function _caller_line(stack_line = _stack()[3]) {
    return (
        stack_line.slice(stack_line.lastIndexOf('/'), stack_line.lastIndexOf(')'))
        || stack_line.slice(stack_line.lastIndexOf('('), stack_line.lastIndexOf(')'))
    )
}
