import Twilio from 'twilio';
import ServerConfig from '../models/serverConfig';
import UserSchema from '../models/user';

function getSmsApiDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: 'smsConfig' })
      .then((foundDetails) => {
        console.log(foundDetails,'checkDetails');
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function sendSms(userId, smsText) {
  console.log(userId,'check userId inside sendSMs')
  UserSchema.findOneAsync({ _id: userId }).then((userObj) => {
    console.log(userObj,'userObj from find')
    getSmsApiDetails().then((details) => {
      console.log(details,'check details of smsApiConfig')
      const twilio = new Twilio(details.accountSid, details.token);
      twilio.messages.create(
        {
          from: details.from,
          to: userObj.phoneNo,
          body: smsText
        },
        (err, result) => {
          if (err) {
            return err;
          }
          return result;
        }
      );
    });
  });
}
export default sendSms;
