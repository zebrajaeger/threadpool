const {PromiseWrapper} = require('./promisewrapper')

class Job {
    _promiseWrapper = new PromiseWrapper();
    _data;

    constructor(data) {
        this._data = data;
    }

    get data() {
        return this._data
    }

    get promiseWrapper() {
        return this._promiseWrapper
    }

    get promise() {
        return this._promiseWrapper.promise
    }

    get reject() {
        return this._promiseWrapper.reject
    }

    get resolve() {
        return this._promiseWrapper.resolve
    }
}

module.exports = {Job}