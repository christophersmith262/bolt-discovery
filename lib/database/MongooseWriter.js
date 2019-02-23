const Transaction = require('./Transaction');

class MongooseWriter {

  write(ModelType, id, attributes) {
    return new Promise((accept, reject) => {
      ModelType.findById(id, (err, model) => {
        if (!model) {
          model = new ModelType({
            _id: id,
          });
        }
        model.set(attributes);
        model.save((err) => {
          if (err) {
            reject(err);
          }
          else {
            accept();
          }
        });
      });
    });
  }

  writeList(ModelType, list, generator) {
    let transaction = new Transaction();

    for (var i in list) {
      let artifact = transaction.createArtifact(i, list[i]);
      generator(artifact, list[i], i);

      Promise.all(artifact.dependencies).then(() => {
        return this.write(ModelType, artifact.get('id'), artifact.get('attributes')).then(() => {
          transaction.success(artifact);
        }).catch((err) => {
          transaction.failure(artifact, err);
        });
      });
    }

    return transaction.ready();
  }

  static cleanKeys(vlue) {
    if (typeof value == 'object') {
      var newObject = {};

      for (var key in value) {
        newObject[deepClean(key)] = deepClean(value[key]);
      }

      return newObject;
    }
    else if (typeof value == 'array') {
      for (var i in value) {
        value[i] = deepClean(value[i]);
      }
    }
    else if (typeof value == 'string') {
      value = value.replace(/\$/g, '_');
    }

    return value;
  }

}

module.exports = MongooseWriter;
