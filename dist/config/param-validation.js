"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _joi = _interopRequireDefault(require("joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = {
  // POST /api/users/register
  createUser: {
    body: {
      email: _joi["default"].string().required(),
      password: _joi["default"].string().required(),
      phoneNo: _joi["default"].string().required()
    }
  },
  // POST /api/posts
  createPost: {
    payload: {
      output: 'file'
    }
  },
  // UPDATE /api/users
  updateUser: {
    body: {
      fname: _joi["default"].string().required(),
      lname: _joi["default"].string().required(),
      phoneNo: _joi["default"].string().required()
    }
  },
  // POST /api/auth/login
  login: {
    body: {
      email: _joi["default"].string().required(),
      password: _joi["default"].string().required(),
      userType: _joi["default"].string().required()
    }
  },
  // POST /api/auth/loginadmin
  loginadmin: {
    body: {
      email: _joi["default"].string().required(),
      password: _joi["default"].string().required()
    }
  },
  // GET /api/admin/user
  userList: {
    query: {
      limit: _joi["default"].number().integer().min(1),
      pageNo: _joi["default"].number().integer().min(1),
      userType: _joi["default"].string().required()
    }
  },
  // Get /api/admin/approvePendingUsers
  pending: {
    query: {
      userType: _joi["default"].string().required()
    }
  },
  // PUT /api/admin/approveUser
  approve: {
    query: {
      id: _joi["default"].string().alphanum().required()
    }
  },
  reject: {
    query: {
      id: _joi["default"].string().alphanum().required()
    }
  },
  // GET /api/admin/allusers
  // alluserList: {
  //   query: {
  //     limit: Joi.number().integer().min(1),
  //   }
  // },
  // PUT /api/admin/user: userId
  updateUserByAdmin: {
    body: {
      _id: _joi["default"].string().alphanum().required(),
      userType: _joi["default"].string().valid("rider", "driver").required()
    }
  },
  // GET /api/admin/tripDetails
  tripList: {
    query: {
      limit: _joi["default"].number().integer().min(1),
      pageNo: _joi["default"].number().integer().min(1)
    }
  },
  // GET /api/admin/tripDetails
  userTripRequestList: {
    query: {
      limit: _joi["default"].number().integer().min(1),
      pageNo: _joi["default"].number().integer().min(1),
      filter: _joi["default"].string()
    }
  },
  tripRevenueGraph: {
    params: {
      revenueYear: _joi["default"].number().integer().min(2000)
    }
  },
  createNewTrip: {
    body: {
      riderId: _joi["default"].string().regex(/^[0-9a-fA-F]{24}$/),
      driverId: _joi["default"].string().regex(/^[0-9a-fA-F]{24}$/)
    }
  },
  updateTripObject: {
    body: {
      riderId: _joi["default"].string().regex(/^[0-9a-fA-F]{24}$/),
      driverId: _joi["default"].string().regex(/^[0-9a-fA-F]{24}$/),
      pickUpAddress: _joi["default"].string(),
      destAddress: _joi["default"].string(),
      paymentMode: _joi["default"].string(),
      taxiType: _joi["default"].string(),
      riderRatingByDriver: _joi["default"].number().integer(),
      driverRatingByRider: _joi["default"].number().integer(),
      tripStatus: _joi["default"].string(),
      tripIssue: _joi["default"].string(),
      tripAmt: _joi["default"].number().integer(),
      seatBooked: _joi["default"].number().integer()
    }
  },
  createNewUser: {
    body: {
      userType: _joi["default"].string().valid("rider", "driver", "admin", "superAdmin").required(),
      email: _joi["default"].string().email().required(),
      password: _joi["default"].string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
    }
  }
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=param-validation.js.map
