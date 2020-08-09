# threadpool

[![NPM Version](https://img.shields.io/npm/v/@zebrajaeger/threadpool.svg?style=flat)](https://www.npmjs.org/package/@zebrajaeger/threadpool)
[![Install Size](https://packagephobia.now.sh/badge?p=@zebrajaeger/threadpool)](https://packagephobia.now.sh/result?p=@zebrajaeger/threadpool)
[![License](https://img.shields.io/github/license/zebrajaeger/threadpool)](https://img.shields.io/github/license/zebrajaeger/threadpool)

js threadpool

## Example

### Pool Code

``` javascript
const path = require('path')
const {StaticWorkerPool} = require('@zebrajaeger/threadpool')

const threadFile = path.resolve(__dirname, 'mythread.js');
(async () => {
    // create pool (default count = os.cpus().length)
    const p = new StaticWorkerPool(threadFile).begin();

    // start 20 jobs
    for (let i = 1; i <= 20; ++i) {
        p.exec(`foo(${i})`).promise.then(r => console.log('xxx', r))
    }

    // wait until all jobs are done
    await p.finished();
    console.log('DONE')

    // shutdown pool
    await p.destroy();
    console.log('Destroyed')
})();
```

### Worker Code (mythread.js)

``` javascript
const {parentPort} = require('worker_threads');

let counter = 0;

// the code to execute: 
// - wait a little bit and then return result
// - on every 5th execution fail 
async function toExec(msg) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (++counter >= 5) {
                counter = 0;
                reject('Oh no!!');
            } else {
                resolve(`Meep(${counter}): '${msg}'`);
            }
        }, 100)
    })
}

// entry point for WorkerPool/WorkerThread
parentPort.on('message', async data => {
    // wrap errors. Not needed but more easy to handle
    try {
        parentPort.postMessage({result: await toExec(data), data});
    } catch (error) {
        parentPort.postMessage({error, data});
    }
});
```
