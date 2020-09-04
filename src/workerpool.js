const EventEmitter = require('events');
const os = require('os')

const {StaticWorkerThread} = require('./workerthread')
const {Job} = require('./job')

class AbstractWorkerPool extends EventEmitter {
    workers_ = [];
    queue_ = [];
    threadCount_;

    constructor(threadCount = os.cpus().length) {
        super();
        this.threadCount_ = threadCount;
    }

    begin() {
        this.workers_ = this.createWorkers_(this.threadCount_);
        this.emit('worker', this.status);
        return this;
    }

    createWorkers_(threadCount) {
        throw new Error('AbstractWorkerPool is abstract');
    }

    exec(data) {
        //console.log('Exec job',data)
        const job = new Job(data);
        this.queue_.push(job);
        this.dispatchWork_();
        return job;
    }

    async finished() {
        if (this.pendingJobs === 0 && this.workingWorkers === 0) {
            return;
        } else {
            return new Promise(resolve => {
                this.once('idle', resolve);
            })
        }
    }

    async destroy() {
        return Promise.all(this.workers_.map(worker => worker.destroy()));
    }

    get pendingJobs() {
        return this.queue_.length
    }

    get workerCount() {
        return this.workers_.length;
    }

    get workingWorkers() {
        return this.workers_.filter(worker => worker.isWorking).length
    }

    get idleWorkers() {
        return this.workers_.filter(worker => !worker.isWorking).length
    }

    get status() {
        return {
            workers: this.workerCount,
            idle: this.idleWorkers,
            working: this.workingWorkers,
            pendingJobs: this.pendingJobs,
        }
    }

    workerReady_() {
        this.dispatchWork_();
        const status = this.status;
        this.emit('worker', status);
        if (status.working === 0) {
            this.emit('idle');
        }
    }

    dispatchWork_() {
        let queueEmpty = false;
        this.workers_
            .filter(worker => !worker.isWorking)
            .forEach(worker => {
                let job = this.queue_.shift();
                //console.log(job)
                if (job) {
                    //console.log(`Start Job '${job.data}'`, )
                    worker.execJob(job);
                } else {
                    queueEmpty = true;
                }
            })
        if (queueEmpty) {
            this.emit('queueEmpty');
        }
    }
}

class StaticWorkerPool extends AbstractWorkerPool {
    codePath_;

    constructor(codePath) {
        super();
        this.codePath_ = codePath;
    }

    createWorkers_(threadCount) {
        const result = [];
        for (let i = 0; i < threadCount; ++i) {
            let workerThread = new StaticWorkerThread(this.codePath_);
            workerThread.on('ready', () => this.workerReady_())
            result.push(workerThread);
        }
        return result;
    }
}

module.exports = {AbstractWorkerPool, StaticWorkerPool};