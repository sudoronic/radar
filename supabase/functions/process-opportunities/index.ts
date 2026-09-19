import {worker} from '../_shared/client.ts';
import {processBatch} from '../_shared/process.ts';
worker(processBatch);
