const Artifact = require('./Artifact');

class Transaction {

  constructor() {
    this.artifacts = [];
    this.completedIds = [];
    this.failedIds = [];
    this.promise = new Promise((accept, reject) => {
      this._accept = accept;
      this._reject = reject;
    });
  }

  createArtifact(key, value) {
    let artifact = new Artifact(key, value);
    this.artifacts.push(artifact);
    return artifact;
  }

  success(artifact) {
    this.completedIds.push(artifact.get('id'));
    artifact.success();
    return this;
  }

  failure(artifact, err) {
    this.failedIds.push(artifact.get('id'));
    artifact.failure(err);
    return this;
  }

  ready() {
    let promises = [];

    for (var i in this.artifacts) {
      promises.push(this.artifacts[i].promise);
    }

    Promise.all(promises).then(this._accept);

    return this;
  }

  dependency(callback) {
    return new Promise((accept, reject) => {
      this.promise.then(() => {
        callback(this);
        accept();
      });
    });
  }

}

module.exports = Transaction;
