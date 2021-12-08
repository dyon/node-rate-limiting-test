import express from 'express';
import logger from 'morgan';
import rateLimiterMiddleware from './middleware/rate-limiter';
import indexRouter from './routes/index';

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(rateLimiterMiddleware);

app.use('/', indexRouter);

export default app;
