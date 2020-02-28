"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.payAll = payAll;
exports.saveTransaction = saveTransaction;
exports["default"] = void 0;

var _stripe = _interopRequireDefault(require("stripe"));

var _appConfig = _interopRequireDefault(require("../models/appConfig"));

var _transaction = _interopRequireDefault(require("../models/transaction"));

var _user = _interopRequireDefault(require("../models/user"));

var _wallet = _interopRequireDefault(require("../models/wallet"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getStripeKey() {
  return new Promise(function (resolve, reject) {
    _appConfig["default"].findOneAsync({
      key: "stripeConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value.stripekey);
    })["catch"](function (err) {
      reject(err);
    });
  });
}

function checkSaveCard(req, res) {
  _user["default"].findOneAsync({
    email: req.body.email
  }).then(function (foundUser) {
    var cardDetails = [];

    if (foundUser.cardDetails.length !== 0) {
      foundUser.cardDetails.map(function (obj) {
        //eslint-disable-line
        var cardObj = {
          brand: obj.brand,
          country: obj.country,
          cvc_check: obj.cvc_check,
          last4: obj.last4,
          fingerprint: obj.fingerprint,
          funding: obj.funding,
          exp_year: obj.exp_year,
          exp_month: obj.exp_month
        };
        cardDetails.push(cardObj);
      });
      res.send({
        data: cardDetails,
        message: "Card Exist"
      });
    } else {
      res.send({
        message: "No Saved Card"
      });
    }
  })["catch"](function (err) {
    console.log(err, "Error"); //eslint-disable-line

    res.send({
      data: err,
      message: "Error"
    });
  });
}

function removeCard(req, res) {
  _user["default"].findOneAsync({
    email: req.body.email
  }).then(function (foundUser) {
    var cardDetails = foundUser.cardDetails;
    var indexOfCard = -1;

    if (cardDetails.length !== 0) {
      cardDetails.map(function (obj, index) {
        //eslint-disable-line
        if (obj.fingerprint === req.body.fingerprint) {
          indexOfCard = index;
        }
      });
    }

    if (indexOfCard === -1) {
      res.send({
        message: "Card Not Found"
      });
    } else {
      cardDetails.splice(indexOfCard, 1);

      _user["default"].findOneAndUpdateAsync({
        _id: foundUser._id
      }, {
        $set: {
          cardDetails: cardDetails
        }
      }, {
        "new": true
      }) //eslint-disable-line
      .then(function (updateUser) {
        var newCardDetails = updateUser.cardDetails;
        res.send({
          data: newCardDetails,
          message: "Card Successfully Removed"
        });
      })["catch"](function (err) {
        res.send({
          data: err,
          message: "Unable to delete card"
        });
      });
    }
  })["catch"](function (err) {
    res.send({
      data: err,
      message: "Error in removing card"
    });
  });
}

function addCard(req, res) {
  var paymentDetails = req.body;
  getStripeKey().then(function (key) {
    var stripe = (0, _stripe["default"])(key);

    _user["default"].findOneAsync({
      email: paymentDetails.email
    }).then(function (foundUser) {
      var user = foundUser;

      if (user.userCardId) {
        stripe.customers.createSource(user.userCardId, {
          source: {
            object: "card",
            exp_month: paymentDetails.expiryMonth,
            exp_year: paymentDetails.expiryYear,
            number: paymentDetails.cardNumber,
            cvc: paymentDetails.cvc
          }
        }).then(function (newCard) {
          var newCardDetails = user.cardDetails;
          var checkUser = false;
          newCardDetails.map(function (obj) {
            //eslint-disable-line
            if (newCard.fingerprint === obj.fingerprint) {
              checkUser = true;
            }
          });

          if (checkUser) {
            res.send({
              message: "Card Already Present"
            });
          } else if (paymentDetails.saveCard) {
            newCardDetails.push(newCard);

            _user["default"].findOneAndUpdateAsync({
              _id: user._id
            }, {
              $set: {
                cardDetails: newCardDetails
              }
            }, {
              "new": true
            }) //eslint-disable-line
            .then(function (updateUser) {
              res.send({
                message: "Successfully Added",
                data: updateUser
              });
            })["catch"](function (err) {
              res.send({
                data: err,
                message: "Error in adding new card details in database"
              });
            });
          } else {
            res.send({
              message: "Card is not saved in database"
            });
          }
        })["catch"](function (err) {
          res.send({
            data: err,
            message: "Error in adding card to Stripe Account"
          });
        });
      } else {
        stripe.customers.create({
          email: paymentDetails.email
        }).then(function (customer) {
          return stripe.customers.createSource(customer.id, {
            source: {
              object: "card",
              exp_month: paymentDetails.expiryMonth,
              exp_year: paymentDetails.expiryYear,
              number: paymentDetails.cardNumber,
              cvc: paymentDetails.cvc
            }
          });
        }).then(function (source) {
          var newCardDetails = user.cardDetails;
          newCardDetails.push(source);

          _user["default"].findOneAndUpdateAsync({
            _id: user._id
          }, {
            $set: {
              cardDetails: newCardDetails,
              userCardId: source.customer
            }
          }, {
            "new": true
          }) //eslint-disable-line
          .then(function (updateUser) {
            res.send({
              message: "Card successfully added and customer id created",
              data: updateUser
            });
          })["catch"](function (err) {
            res.send({
              data: err,
              message: "Error in adding new card data for new user"
            });
          });
        })["catch"](function (err) {
          res.send({
            data: err,
            message: "Error in adding new card in stripe"
          });
        });
      }
    })["catch"](function (err) {
      res.send({
        data: err,
        message: "Error in finding user"
      });
    });
  });
}

function updateCard(req, res) {
  var cardDetails = req.body;
  getStripeKey().then(function (key) {
    var stripe = (0, _stripe["default"])(key);

    _user["default"].findOneAsync({
      email: cardDetails.email
    }).then(function (foundUser) {
      var user = foundUser;
      var cardId = null;

      if (cardDetails.fingerprint) {
        user.cardDetails.map(function (obj) {
          //eslint-disable-line
          if (cardDetails.fingerprint === obj.fingerprint) {
            cardId = obj.id;
          }
        });

        if (cardId) {
          stripe.customers.update(user.userCardId, {
            default_source: cardId
          }).then(function (checkCard) {
            console.log("Deault Card Changed", checkCard); //eslint-disable-line
          })["catch"](function (err) {
            res.send({
              data: err,
              message: "Error in changing default card"
            });
          });
        } else {
          res.send({
            message: "No card found "
          });
        }

        res.send({
          message: "Updated Successfully"
        });
      } else {
        res.send({
          message: "Fingerprint data not available"
        });
      }
    })["catch"](function (err) {
      res.send({
        data: err,
        message: "Error in updating card details"
      });
    });
  });
}

function cardPayment(tripObj) {
  return new Promise(function (resolve, reject) {
    getStripeKey().then(function (key) {
      var stripe = (0, _stripe["default"])(key);
      stripe.setTimeout(20000);

      _user["default"].findOneAsync({
        email: tripObj.rider.email
      }).then(function (foundUser) {
        var user = foundUser;
        stripe.charges.create({
          amount: tripObj.tripAmt,
          currency: "usd",
          customer: user.userCardId
        }).then(function (charge) {
          var paymentStatus = charge.status; // add transaction here

          resolve(paymentStatus);
        })["catch"](function (err) {
          var paymentStatus = "error";
          console.log(err); //eslint-disable-line
          // transaction here failed

          resolve(paymentStatus);
        });
      })["catch"](function (err) {
        var paymentStatus = "error";
        console.log(err); //eslint-disable-line

        reject(paymentStatus);
      });
    });
  })["catch"](function (e) {
    console.log("test", e); //eslint-disable-line
  });
}

function getBalance(req, res) {
  _wallet["default"].findOneAsync({
    userEmail: req.body.email
  }).then(function (foundWallet) {
    if (foundWallet !== null) {
      var returnObj = {
        success: true,
        message: "",
        data: {}
      };
      returnObj.data.user = foundWallet;
      returnObj.message = "Wallet Present for this account";
      res.send(returnObj);
    } else {
      var _returnObj = {
        success: false,
        message: "",
        data: {}
      };
      _returnObj.data.user = foundWallet;
      _returnObj.message = "No wallet Present for this account";
      res.send(_returnObj);
    }
  });
}

function payAll(tripObj) {
  _wallet["default"].findOneAndUpdateAsync({
    userEmail: tripObj.rider.email
  }, {
    $inc: {
      walletBalance: -Number(tripObj.tripAmt) * 100
    }
  }).then(function (updateWalletObj) {
    if (updateWalletObj) {
      // transaction insert
      var transactionOwner = new _transaction["default"]({
        userIdFrom: tripObj.riderId,
        tripId: tripObj._id,
        //eslint-disable-line
        amount: Number(tripObj.tripAmt) * 20,
        // couz value is in cents
        walletIdFrom: tripObj.rider.email
      });
      transactionOwner.saveAsync().then(function (transactionRider) {
        var returnObj = {
          success: true,
          message: "",
          data: {}
        };
        returnObj.data.user = transactionRider;
        returnObj.message = "transaction created successfully wallet was present";
      });

      _wallet["default"].findOneAndUpdateAsync({
        userEmail: tripObj.driver.email
      }, {
        $inc: {
          walletBalance: Number(tripObj.tripAmt) * 80
        }
      }).then(function (WalletObjDriver) {
        console.log(WalletObjDriver); //eslint-disable-line

        var transactionDriver = new _transaction["default"]({
          userIdTo: tripObj.driverId,
          userIdFrom: tripObj.riderId,
          amount: Number(tripObj.tripAmt) * 80,
          tripId: tripObj._id,
          //eslint-disable-line
          walletIdFrom: tripObj.rider.email,
          walletIdTo: tripObj.driver.email
        });
        transactionDriver.saveAsync().then(function (transactionRider) {
          var returnObj = {
            success: true,
            message: "",
            data: {}
          };
          returnObj.data.user = transactionRider;
          returnObj.message = "transaction created successfully wallet was not present";
        });
      });
    } else {
      var returnObj = {
        success: false,
        message: "",
        data: {}
      };
      returnObj.data.user = updateWalletObj;
      returnObj.message = "walletBalance updatation failed";
      returnObj.success = false;
    }
  });
}

function addBalance(req, res, next) {
  _wallet["default"].findOneAndUpdateAsync({
    userEmail: req.body.riderEmail
  }, {
    $inc: {
      walletBalance: Number(req.body.amount)
    }
  }).then(function (updateWalletObj) {
    if (updateWalletObj) {
      // transaction insert
      var transactionOwner = new _transaction["default"]({
        userIdFrom: req.body.riderEmail,
        tripId: req.body.tripId,
        amount: Number(req.body.amount),
        walletIdFrom: req.body.riderEmail
      });
      transactionOwner.saveAsync().then(function (transactionRider) {
        var returnObj = {
          success: true,
          message: "",
          data: {}
        };
        returnObj.data.user = transactionRider;
        returnObj.message = "transaction created successfully";
        res.send(returnObj);
      });
    } else {
      var wallet = new _wallet["default"]({
        userEmail: req.body.riderEmail,
        walletBalance: req.body.amount
      });
      wallet.saveAsync().then(function (savedWallet) {
        console.log(savedWallet); //eslint-disable-line

        var transactionOwner = new _transaction["default"]({
          userIdFrom: req.body.riderEmail,
          tripId: req.body.tripId,
          amount: Number(req.body.amount),
          walletIdFrom: req.body.riderEmail
        });
        transactionOwner.saveAsync().then(function (transactionRider) {
          var returnObj = {
            success: true,
            message: "",
            data: {}
          };
          returnObj.data.user = transactionRider;
          returnObj.message = "transaction created successfully";
          res.send(returnObj);
        }).error(function (e) {
          console.log("error", e);
        }); //eslint-disable-line
      });
    }
  }).error(function (e) {
    next(e);
  });
}

function saveTransaction(tripObj) {
  var transactionOwner = new _transaction["default"]({
    userIdFrom: tripObj.riderId,
    tripId: tripObj._id,
    //eslint-disable-line
    amount: Number(tripObj.tripAmt),
    userIdTo: tripObj.driverId
  });
  transactionOwner.saveAsync().then(function (transactionRider) {
    var returnObj = {
      success: true,
      message: "",
      data: {}
    };
    returnObj.data.user = transactionRider;
    returnObj.message = "Transaction created successfully";
  });
}

var _default = {
  getStripeKey: getStripeKey,
  payAll: payAll,
  getBalance: getBalance,
  addBalance: addBalance,
  checkSaveCard: checkSaveCard,
  removeCard: removeCard,
  addCard: addCard,
  cardPayment: cardPayment,
  updateCard: updateCard,
  saveTransaction: saveTransaction
};
exports["default"] = _default;
//# sourceMappingURL=payment.js.map
