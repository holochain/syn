import { _b } from '@ctx-core/object'
const in_console = console
export const console_b = _b('console', () => {
    const console = {
        debug: in_console.debug,
        info: in_console.info,
        log: in_console.log,
        warn: in_console.warn,
        error: in_console.error,
        trace: in_console.trace,
    }
    return console
})
