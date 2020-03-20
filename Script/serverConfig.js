/* eslint-disable */
const printMessage = require("print-message");
const async = require("async");
// Import mongoose.js to define our schema and interact with MongoDB
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
// Import bcrypt-nodejs for hashing passwords on MongoDB
let databaseName = "taxiApp-development";

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === "development") {
  databaseName = "taxiApp-development";
}
if (nodeEnv === "production") {
  databaseName = "taxiApp-api-production";
}
// URL to connect to a local MongoDB with database test.
// Change this to fit your running MongoDB instance
//  const databaseURL = `mongodb://localhost:27017/${databaseName}`;
//const databaseURL = `mongodb+srv://nitprise:Rishabh2019@cluster0-sclfx.mongodb.net/test?retryWrites=true&w=majority`;
const databaseURL = `mongodb+srv://rajeev:SzjcRGwIFfdR8uGJ@cluster0-sclfx.mongodb.net/klixx?retryWrites=true&w=majority/${databaseName}`;
console.log("serverCon.js---"+databaseURL)
printMessage(
  [
    "Please have patience while TaxiApp get Installed .This will take around 10 - 15 minutes."
  ],
  {
    color: "green",
    borderColor: "red"
  }
);

// Setting up the Token

const ServerConfigSchema = new mongoose.Schema({
  type: { type: Schema.Types.Mixed },
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed }
});

const ServerConfig = mongoose.model("ServerConfig", ServerConfigSchema);

// Async series method to make sure asynchronous calls below run sequentially
async.series(
  [
    // function - connect to MongoDB using mongoose, which is an asynchronous call
    function(callback) {
      // Open connection to MongoDB
      mongoose.connect(databaseURL);
      // Need to listen to 'connected' event then execute callback method
      // to call the next set of code in the async.serial array
      mongoose.connection.on("connected", () => {
        console.log("db connected via mongoose");
        // Execute callback now we have a successful connection to the DB
        // and move on to the third function below in async.series
        callback(null, "SUCCESS - Connected to mongodb");
      });
    },

    // function - use Mongoose to create a User model and save it to database
    function(callback) {
      // BEGIN SEED DATABASE
      // Use an array to store a list of User model objects to save to the database
      const serverConfigs = [];
      const serverConfig1 = new ServerConfig({
        type: "object",
        key: "cloudinaryConfig",
        value: {
          cloud_name: "nitprise",
          api_key: "515287861755992",
          api_secret: "b6DizPPhIwOxthrzDJJTiFAuynA"
        }
      });
      // eslint-disable-next-line no-use-before-define
      /*eslint-disable */
      // eslint-disable-next-line no-use-before-define
      const value = serverConfig1;
      serverConfigs.push(eval(value));
      // console.log(eval(value));

      /*eslint-disable */
      console.log(
        "Populating database with %s serverConfigs",
        serverConfigs.length
      );
      // Use 'async.eachSeries' to loop through the 'users' array to make
      // sure each asnychronous call to save the user into the database
      // completes before moving to the next User model item in the array
      async.eachSeries(
        // 1st parameter is the 'users' array to iterate over
        serverConfigs,
        (admin, userSavedCallBack) => {
          // There is no need to make a call to create the 'test' database.
          // Saving a model will automatically create the database
          admin.save(err => {
            if (err) {
              // Send JSON response to console for errors
              console.dir(err);
            }

            // Print out which user we are saving
            console.log("Saving user #%s", admin.key);

            // Call 'userSavedCallBack' and NOT 'callback' to ensure that the next
            // 'user' item in the 'users' array gets called to be saved to the database
            userSavedCallBack();
          });
        },
        // 3rd parameter is a function to call when all users in 'users' array have
        // completed their asynchronous user.save function
        err => {
          if (err) {
            console.log("Finished aysnc.each in seeding db");
          }
          console.log("Finished aysnc.each in seeding db");

          // Execute callback function from line 130 to signal to async.series that
          // all asynchronous calls are now done
          callback(null, "SUCCESS - Seed database");
        }
      );
      // END SEED DATABASE
    }
  ],
  // This function executes when everything above is done
  (err, results) => {
    console.log("\n\n--- Database seed progam completed ---");

    if (err) {
      console.log("Errors = ");
      console.dir(err);
    } else {
      console.log("Results = ");
      console.log(results);
    }

    console.log("\n\n--- Exiting database seed progam ---");
    // Exit the process to get back to terrminal console
    process.exit(0);
  }
);
