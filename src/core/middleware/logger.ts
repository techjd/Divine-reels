import morgan from 'morgan';

// HTTP request logger configured for concise output.
export const requestLogger = morgan(':method :url :status :response-time ms');
