const config = require('../config.js'),
  mongoose = require('mongoose');

module.exports = {
  connect: async () => { await mongoose.connect(config.db, {useNewUrlParser: true}); },
  Artifact: require('./Artifact'),
  MongooseWriter: require('./MongooseWriter'),
  Transaction: require('./Transaction'),
}
