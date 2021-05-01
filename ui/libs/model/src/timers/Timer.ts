export class Timer {
    interval_id:any
    constructor(protected setInterval_fn:()=>void, protected interval_ms:number) {}
    start() {
        this.stop()
        this.interval_id = setInterval(this.setInterval_fn, this.interval_ms)
    }
    stop() {
        const { interval_id } = this
        if (interval_id) {
            clearInterval(interval_id)
            this.interval_id = null
        }
    }
}
