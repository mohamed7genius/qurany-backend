const mongoose = require("mongoose");

const { MONGO_URI } = process.env;

// Mongoose will change the default value to false
mongoose.set('strictQuery', true);

const connectToDB = (cb) => {
  // Connecting to the database
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log("Successfully connected to database");
      cb();
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};
  
module.exports = {connectToDB};