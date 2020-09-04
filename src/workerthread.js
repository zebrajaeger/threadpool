const EventEmitter = require('events');
const {Worker} = require('worker_threads');

class AbstractWorkerThread extends EventEmitter {
    isWorking_ = false;
    worker = null;

    job = null;

    constructor() {
        super();
    }

    get isWorking() {
        return this.isWorking_
    }

    execJob(job) {
        // console.log('AddJob',job)

        if (this.isWorking) {
            throw new Error(' Worker is already working');
        }

        if (!this.worker_) {
            this.worker_ = this.createWorker();
        }

        this.job_ = job;

        this.isWorking_ = true;
        this.worker_.postMessage(job.data);
    }

    async destroy() {
        return (this.worker_)
            ? this.worker_.terminate()
            : null;
    }

    createWorker() {
        throw new Error('AbstractWorkerThread is abstract');
    };

    threadOnMessage(msg) {
        this.job_.resolve(msg);
        this.isWorking_ = false;
        this.emit('ready');
    }

    threadOnError(err) {
        this.job_.reject(err);
        this.isWorking_ = false;
        this.worker_ = null; // worker is dead
        this.emit('ready');
    }

    threadOnExit(statusCode) {
        //console.log('OnExit', statusCode);
        // todo LOG ME
    }
}

class StaticWorkerThread extends AbstractWorkerThread {
    codePath_;

    constructor(filePath) {
        super();
        this.codePath_ = filePath;
    }

    createWorker() {
        const result = new Worker(this.codePath_);
        result.on('message', msg => this.threadOnMessage(msg));
        result.on('error', err => this.threadOnError(err));
        result.on('exit', statusCode => this.threadOnExit(statusCode));
        return result;
    }
}

module.exports = {AbstractWorkerThread, StaticWorkerThread};