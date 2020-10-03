// config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  uri: process.env.MONGODB_URI,
};

