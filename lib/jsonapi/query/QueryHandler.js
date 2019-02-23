class QueryHandler {

  async preprocess(context, opts) {
  }

  async alter(context, req, query) {
    return query;
  }

}

module.exports = QueryHandler;
