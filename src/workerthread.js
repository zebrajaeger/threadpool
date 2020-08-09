const EventEmitter = require('events');
const {Worker} = require('worker_threads');

class AbstractWorkerThread extends EventEmitter {
    _isWorking = false;
    _worker = null;

    _job = null;

    constructor() {
        super();
    }

    get isWorking() {
        return this._isWorking
    }

    execJob(job) {
        // console.log('AddJob',job)

        if (this.isWorking) {
            throw new Error(' Worker is already working');
        }

        if (!this._worker) {
            this._worker = this.createWorker();
        }

        this._job = job;

        this._isWorking = true;
        this._worker.postMessage(job.data);
    }

    async destroy() {
        return (this._worker)
            ? this._worker.terminate()
            : null;
    }

    createWorker() {
        throw new Error('AbstractWorkerThread is abstract');
    };

    threadOnMessage(msg) {
        this._job.resolve(msg);
        this._isWorking = false;
        this.emit('ready');
    }

    threadOnError(err) {
        this._job.reject(err);
        this._isWorking = false;
        this._worker = null; // worker is dead
        this.emit('ready');
    }

    threadOnExit(statusCode) {
        //console.log('OnExit', statusCode);
        // todo LOG ME
    }
}

class StaticWorkerThread extends AbstractWorkerThread {
    _codePath;

    constructor(filePath) {
        super();
        this._codePath = filePath;
    }

    createWorker() {
        const result = new Worker(this._codePath);
        result.on('message', msg => this.threadOnMessage(msg));
        result.on('error', err => this.threadOnError(err));
        result.on('exit', statusCode => this.threadOnExit(statusCode));
        return result;
    }
}

module.exports = {AbstractWorkerThread,StaticWorkerThread};