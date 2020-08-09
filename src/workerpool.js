const EventEmitter = require('events');
const os = require('os')

const {StaticWorkerThread} = require('./workerthread')
const {Job} = require('./job')

class AbstractWorkerPool extends EventEmitter {
    _workers = [];
    _queue = [];
    _threadCount;

    constructor(threadCount = os.cpus().length) {
        super();
        this._threadCount = threadCount;
    }

    begin() {
        this._workers = this.createWorkers(this._threadCount);
        return this;
    }

    createWorkers(threadCount) {
        throw new Error('AbstractWorkerPool is abstract');
    }

    exec(data) {
        //console.log('Exec job',data)
        const job = new Job(data);
        this._queue.push(job);
        this._dispatchWork();
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
        return Promise.all(this._workers.map(worker => worker.destroy()));
    }

    get pendingJobs() {
        return this._queue.length
    }

    get workerCount() {
        return this._workers.length;
    }

    get workingWorkers() {
        return this._workers.filter(worker => worker.isWorking).length
    }

    get idleWorkers() {
        return this._workers.filter(worker => !worker.isWorking).length
    }

    _workerReady() {
        this._dispatchWork();
        if (this.workingWorkers === 0) {
            this.emit('idle');
        }
    }

    _dispatchWork() {
        let queueEmpty = false;
        this._workers
            .filter(worker => !worker.isWorking)
            .forEach(worker => {
                let job = this._queue.shift();
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
    _codePath;

    constructor(codePath) {
        super();
        this._codePath = codePath;
    }

    createWorkers(threadCount) {
        const result = [];
        for (let i = 0; i < threadCount; ++i) {
            let workerThread = new StaticWorkerThread(this._codePath);
            workerThread.on('ready', () => this._workerReady())
            result.push(workerThread);
        }
        return result;
    }
}

module.exports = {AbstractWorkerPool, StaticWorkerPool};