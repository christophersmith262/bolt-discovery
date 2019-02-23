const API = require('json-api'),
  config = require('../../config');
  
function defaults(type) {
  return {
    urlTemplates: {
      "self": config.server.host + "/" + type + "/{id}",
      "relationship": config.server.host + "/" + type + "/{ownerId}/relationships/{path}",
      "related": config.server.host + "/" + type + "/{ownerId}/{path}",
    },
    pagination: {
      maxPageSize: 25,
      defaultPageSize: 10,
    },
  };
}

function componentsRelationship(def) {
  const parentMethod = def.beforeRender
    ? def.beforeRender : (resource) => {
      return resource;
    };

  def.beforeRender = function(resource, meta, extras, superFn) {
    resource = parentMethod(resource);

    resource.relationships.components = API.Relationship.of({
      links: {
        related: ({type, ownerId}) =>
          config.server.host + `/component-releases?filter=(release,\`${ownerId}\`)`
      },
      owner: { type: resource.type, id: resource.id, path: "components"}
    });

    return resource;
  }

  return def;
}

module.exports = {
  'releases': componentsRelationship(defaults('releases')),
  'package-releases': defaults('package-releases'),
  'component-releases': defaults('component-releases'),
};
