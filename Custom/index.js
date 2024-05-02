const { Worker } = require('worker_threads');
const os = require('os');

// Function to calculate prime numbers
function calculatePrimes(start, range, numWorkers) {
    const workers = [];
    const results = [];

    // Create workers
    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker('./worker.js', { workerData: { start: start, range: range / numWorkers } });
        workers.push(worker);

        // Collect results
        worker.on('message', (primes) => {
            results.push(...primes);
        });

        // Handle errors
        worker.on('error', (err) => {
            console.error(`Worker encountered an error: ${err.message}`);
        });

        // Handle exit
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
        });
    }

    // Wait for all workers to finish
    return new Promise((resolve) => {
        let finishedCount = workers.length;
        workers.forEach((worker) => {
            worker.once('exit', () => {
                finishedCount--;
                if (finishedCount === 0) {
                    resolve(results.flat());
                }
            });
        });
    });
}

/**
 * Benchmark Function
 * 
 * @param {number} range Total range for prime number calculation
 * @param {number} numCPUs Number of CPUs available
 */
async function benchmark(range = 1e9, numCPUs = os.cpus().length) {
    console.log(`Benchmarking with ${numCPUs} CPUs...`);

    // Run the benchmark for different numbers of workers
    for (let numWorkers = 1; numWorkers <= numCPUs; numWorkers++) {
        const startTime = Date.now();
        await calculatePrimes(1, range, numWorkers);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // Convert milliseconds to seconds

        console.log(`Execution time with ${numWorkers} workers: ${duration.toFixed(2)} seconds`);
    }
}

// Testing with i5 13600K in Full Performance Mode
benchmark(1e10, 20);