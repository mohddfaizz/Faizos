const mongoose = require("mongoose");

const uri =  process.env.MONGODB_URI

if (!uri) {
  console.error('MongoDB URI is not defined');
  process.exit(1); // Exit the process if Mongo URI is missing
}

const connectDatabase = async () => {
    await mongoose.connect(uri);
};

module.exports = connectDatabase;
