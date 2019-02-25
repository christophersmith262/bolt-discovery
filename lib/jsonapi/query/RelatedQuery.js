const API = require('json-api'),
  QueryHandler = require('./QueryHandler');

class RelatedQuery extends QueryHandler {

  constructor(type, fieldName) {
    super();
    this.type = type;
    this.fieldName = API.helpers.Identifier(fieldName);
  }

  async preprocess(context, opts) {
    opts.request.type = this.type;
    context.id = String(decodeURIComponent(opts.request.id));
    delete opts.request.id;
  }

  async alter(context, req, query) {
    return query.andWhere(API.helpers.FieldExpression("eq", [this.fieldName, context.id]));
  }

}

module.exports = RelatedQuery;
