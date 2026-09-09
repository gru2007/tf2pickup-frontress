import { Mutex } from 'async-mutex'

export const createMutex = new Mutex()
