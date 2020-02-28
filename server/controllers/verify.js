/* eslint-disable */
import ServerConfig from '../models/serverConfig';  //eslint-disable-line
import User from '../models/user';


function mobileVerify(req, res, next) {

}

function emailVerify(req, res, next) {

  User.findOneAsync({ email: req.query.email })
  //eslint-disable-next-line
  .then(foundUser => {
    if (foundUser) {
  const host=req.get('host');
  console.log(req.protocol+":/"+req.get('host'));
  if((req.protocol+"://"+req.get('host'))==("http://"+host))
  {
      console.log("Domain is matched. Information is from Authentic email");
      if(req.query.check === foundUser.otp)
      {
        User.findOneAndUpdateAsync({  email: req.query.email }, { $set: { emailVerified: true } }, { new: true }) //eslint-disable-line
          .then((updateUserObj) => { //eslint-disable-line
        if (updateUserObj) {
          const returnObj = {
            success: true,
            message: 'Email verified',
            data: {}
          };
          // returnObj.data.user = updateUserObj;
          returnObj.success = true;
          return res.send(returnObj);
        }
      })
      .error((e) => {
        const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
          console.log("Email is verified");
          res.end("<h1>Email is been Successfully verified</h1>");
      }
      else
      {
          console.log("Email is not verified");
          res.end("<h1>Bad Request</h1>");
      }
}
    }
  });
}

export default { mobileVerify, emailVerify };
