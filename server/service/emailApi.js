/* eslint-disable */
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import path from "path";
import ServerConfig from "../models/serverConfig";
import UserSchema from "../models/user";

const EmailTemplate = require("email-templates");

const registerDir = path.resolve(__dirname, "../templates", "register");
const register = new EmailTemplate(path.join(registerDir));

const endtripDir = path.resolve(__dirname, "../templates", "endTrip");
const endTrip = new EmailTemplate(path.join(endtripDir));

const forgotDir = path.resolve(__dirname, "../templates", "forgotPassword");
const forgot = new EmailTemplate(path.join(forgotDir));

const rideAcceptDir = path.resolve(__dirname, "../templates", "rideAccept");
const rideAccept = new EmailTemplate(path.join(rideAcceptDir));

const emailDir = path.resolve(__dirname, "../templates", "emailVerify");
const emailVerify = new EmailTemplate(path.join(emailDir));

function getEmailApiDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: "emailConfig" })
      .then(foundDetails => {
        resolve(foundDetails.value);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function sendEmail(userId, responseObj, type) {
  UserSchema.findOneAsync({ _id: userId }).then(userObj => {
    getEmailApiDetails().then(details => {
      console.log(details, "check emailApiDetails");
      const transporter = nodemailer.createTransport(
        smtpTransport({
          host: details.host,
          port: details.port,
          secure: details.secure, // secure:true for port 465, secure:false for port 587
          auth: {
            user: details.username,
            pass: details.password
          }
        })
      );
      const locals = Object.assign({}, { data: responseObj });

      if (type === "emailVerify") {
        emailVerify.render(locals, (err, results) => {
          //eslint-disable-line
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: "Verify your Account with Strap TaxiApp", // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("error in emailApi", error);
              return error;
            }
            console.log("result in emailApi", info);
            return info;
          });
        });
      }

      if (type === "register") {
        register.render(locals, (err, results) => {
          //eslint-disable-line
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: "Your Account with Strap TaxiApp is created", // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("error in emailApi", error);
              return error;
            }
            console.log("result in emailApi", info);
            return info;
          });
        });
      }
      if (type === "endTrip") {
        endTrip.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: "Ride Details with Strap TaxiApp", // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("error in emailApi", error);
              return error;
            }
            console.log("result in emailApi", info);
            return info;
          });
        });
      }
      if (type === "forgot") {
        forgot.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: "Your Account Password with Strap TaxiApp", // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("error in emailApi", error);
              return error;
            }
            console.log("result in emailApi", info);
            return info;
          });
        });
      }
      if (type === "rideAccept") {
        rideAccept.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: "Strap TaxiApp Driver Details", // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("error in emailApi", error);
              return error;
            }
            console.log("result in emailApi", info);
            return info;
          });
        });
      }
    });
  });
}
export default sendEmail;
