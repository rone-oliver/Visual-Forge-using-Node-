import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { IHashingService } from './interfaces/hashing.service.interface';

@Injectable()
export class HashingService implements IHashingService {
    private readonly _logger = new Logger(HashingService.name);

    hash(password: string): Promise<string> {
        const workerPath = path.resolve(__dirname, 'workers', 'hash.worker.js');

        return new Promise((resolve, reject) => {
            const worker = new Worker(workerPath, {
                workerData: { password },
            });

            worker.on('message', (message) => {
                if (message.status === 'success') {
                    resolve(message.hashedPassword);
                } else {
                    reject(new Error(message.message || 'Password hashing failed in worker.'));
                }
                worker.terminate();
            });

            worker.on('error', (err) => {
                this._logger.error(`Worker error: ${err.message}`, err.stack);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    const errorMessage = `Worker stopped with exit code ${code}`;
                    this._logger.error(errorMessage);
                    reject(new Error(errorMessage));
                }
            });
        });
    }

    compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash);
    }
}