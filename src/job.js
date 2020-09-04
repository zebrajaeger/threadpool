const {PromiseWrapper} = require('./promisewrapper')

class Job {
    promiseWrapper_ = new PromiseWrapper();
    data_;

    constructor(data) {
        this.data_ = data;
    }

    get data() {
        return this.data_;
    }

    get promiseWrapper() {
        return this.promiseWrapper_
    }

    get promise() {
        return this.promiseWrapper_.promise
    }

    get reject() {
        return this.promiseWrapper_.reject
    }

    get resolve() {
        return this.promiseWrapper_.resolve
    }
}

module.exports = {Job}