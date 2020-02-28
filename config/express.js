import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import expressValidation from 'express-validation';
import expressWinston from 'express-winston';
import helmet from 'helmet';
import httpStatus from 'http-status';
import methodOverride from 'method-override';
import passport from 'passport';
import path from 'path';
import APIError from '../server/helpers/APIError';
import config from './env';
import routes from '../server/routes';
import winstonInstance from './winston';

import passConfig from './passport-config';


const app = express();
const server = require('http').createServer(app);

if (config.env === 'development') {
  // app.use(logger('dev'));
}

// parse body params and attache them to req.body

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// configure passport for authentication
passConfig(passport);
app.use(passport.initialize());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable detailed API logging in dev env
if (config.env === 'development') {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
}


// mount public folder on / path
app.get('', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../public/index.html'));
});

// mount all routes on /api path
app.use('/api', routes);


// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  // console.log('===============================================');
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance
  }));
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => //eslint-disable-line
  res.status(err.status).json({
    success: false,
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {}
  }));

export default server;
