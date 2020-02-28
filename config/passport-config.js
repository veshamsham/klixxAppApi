import passportJWT from 'passport-jwt';
import cfg from './env';
import UserSchema from '../server/models/user';

const ExtractJwt = passportJWT.ExtractJwt;
const jwtStrategy = passportJWT.Strategy;

function passportConfiguration(passport) {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  // opts.tokenQueryParameterName = ExtractJwt.fromUrlQueryParameter(auth_token);
  opts.secretOrKey = cfg.jwtSecret;
  passport.use(new jwtStrategy(opts, (jwtPayload, cb) => {
    UserSchema.findOneAsync({ _id: jwtPayload._id }) //eslint-disable-line
      .then(user => cb(null, user))
      .error(err => cb(err, false));
  }));
}

export default passportConfiguration;
