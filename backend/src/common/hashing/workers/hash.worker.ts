import { parentPort, workerData } from 'worker_threads';
import * as bcrypt from 'bcrypt';

if (parentPort && workerData) {
    const { password } = workerData;

    bcrypt.hash(password, 10)
        .then(hashedPassword => {
            if (parentPort) {
                parentPort.postMessage({ status: 'success', hashedPassword });
            }
        })
        .catch(error => {
            if (parentPort) {
                parentPort.postMessage({ status: 'error', message: error.message });
            }
        });
}