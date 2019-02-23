#!/usr/bin/env node

const express = require("express"),
  config = require("./lib/config"),
  database = require("./lib/database"),
  jsonapi = require("./lib/jsonapi");

database.connect().then(() => {
  const app = express(),
    types = 'releases|package-releases|component-releases'

  app.get("/", jsonapi.front.docsRequest);

  app.get("/:type(" + types + ")", jsonapi.handler([
    new jsonapi.query.Pagination(),
  ]));

  app.get("/:type(" + types + ")/:id", jsonapi.handler([
    new jsonapi.query.Pagination(),
  ]));

  app.use("/:type(releases)/:id/relationships/components", (req, res, next) => {
    res.json({
      'links': {
        "self": req.protocol + "://" + req.get('host') + req.originalUrl,
        "related": config.server.host + "/component-releases?filter=(release,`" + req.params.id + "`)",
      },
    });
  });

  app.get("/:type(" + types + ")/:id/relationships/:relationship", jsonapi.handler([
    new jsonapi.query.Pagination(),
  ]));

  app.get('/:type(releases)/:id/packages', jsonapi.handler([
    new jsonapi.query.RelatedQuery("package-releases", "release"),
    new jsonapi.query.Pagination(),
  ]));

  app.get('/:type(package-releases)/:id/components', jsonapi.handler([
    new jsonapi.query.RelatedQuery("component-releases", "release"),
    new jsonapi.query.Pagination(),
  ]));

  app.listen(config.server.port);

  console.log("Bolt Discovery: Listening on port " + config.server.port);
}).catch((err) => {
  console.log("Couldn't start listening:");
  console.log(err);
});
