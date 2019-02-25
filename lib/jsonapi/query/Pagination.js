const QueryHandler = require('./QueryHandler');

class Pager {

  constructor(total, req, query) {
    this.total = total;
    this.baseUrl = req.protocol + '://' + req.get('host');
    this.path = req.originalUrl;
    this.offset = query.query.criteria.offset ? query.query.criteria.offset : 0;
    this.limit = query.query.criteria.limit;
    this.remaining = Math.floor(this.total - (this.offset + this.limit));
  }

  current() {
    return this.baseUrl + this.path;
  }

  first() {
    return this.baseUrl + this.path.replace(/[?&]page(\[|%5[bB])offset(\]|%5[dD])=[0-9]+/, '');
  }

  last() {
    return this.page((Math.ceil(this.total / this.limit) - 1) * this.limit);
  }

  next() {
    return this.page(this.offset + this.limit);
  }

  prev() {
    return this.page(this.offset - this.limit);
  }

  page(offset) {
    if (offset < 0) {
      offset = 0;
    }

    if (!offset) {
      return this.first();
    }
    else if (offset >= this.total) {
      if (offset == this.total) {
        throw new Error();
      }
      return this.last();
    }
    else if (offset != this.offset) {
      let path = this.path.replace(/([?&])page(\[|%5[bB])offset(\]|%5[dD])=[0-9]+/, '$1page$2offset$3=' + offset);

      if (path == this.path) {
        if (path.indexOf('?') > -1) {
          path += '&page[offset]=' + offset;
        }
        else {
          path += '?page[offset]=' + offset;
        }
      }

      return this.baseUrl + path;
    }
    else {
      return this.current();
    }
  }

}

class Pagination extends QueryHandler {

  async alter(context, req, query) {
    const origReturning = query.returning;

    return query.resultsIn(async (...args) => {
      const origResult = await origReturning(...args);

      if (origResult.document.meta && origResult.document.meta.total) {
        const total = origResult.document.meta.total,
          pager = new Pager(total, req, query);

        if (pager.total > pager.limit) {
          let items = {
            "first": () => { return pager.first() },
            "last": () => { return pager.last() },
          };

          if (pager.remaining > 0) {
            items["next"] = () => { return pager.next() };
          }

          if (pager.offset > 0) {
            items["prev"] = () => { return pager.prev() };
          }

          origResult.document.primary.links = Object.assign(items, origResult.document.primary.links);
        }
      }

      return origResult;
    });
  }

}

module.exports = Pagination;
