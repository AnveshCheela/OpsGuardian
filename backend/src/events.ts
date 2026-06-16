import { EventEmitter } from 'events';

// A shared event bus for the backend application
export const globalEvents = new EventEmitter();
