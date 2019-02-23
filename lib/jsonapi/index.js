const API = require("json-api"),
  path = require("path"),
  config = require('../config'),
  models = require('../models'),
  descriptions = require('./resource-descriptions');
  
API.dbAdapters.Mongoose.idIsValid = function(id) {
  return typeof id === "string" && id.length < 256;
}

const adapter = new API.dbAdapters.Mongoose(models),
  registry = new API.ResourceTypeRegistry(descriptions, { dbAdapter: adapter }),
  Controller = new API.controllers.API(registry),
  Docs = new API.controllers.Documentation(registry, {
    name: 'Bolt Discovery API'
  }, path.resolve(__dirname + '/../../', config.docs.template)),
  front = new API.httpStrategies.Express(Controller, Docs, { host: config.server.host });

function handler(plugins) {
  return front.customAPIRequest({
    queryFactory: async (opts) => {
      context = {};

      for (var i in plugins) {
        await plugins[i].preprocess(context, opts);
      }

      query = await opts.makeQuery(opts);

      for (var i in plugins) {
        query = await plugins[i].alter(context, opts.serverReq, query);
      }

      return query;
    },
  });
}

module.exports = {
  front: front,
  handler: handler,
  query: require('./query'),
}
