class Artifact {

  constructor(key, value) {
    this.data = {};
    this.dependencies = [];
    this.promise = new Promise((accept, reject) => {
      this._accept = accept;
      this._reject = reject;
    });
    this.key = key;
    this.value = value;
  }

  success() {
    this._accept();
  }

  failure(err) {
    this._reject(err);
  }

  dependsOn(promise) {
    this.dependencies.push(promise);
  }

  set(data) {
    for (var i in data) {
      this.data[i] = data[i];
    }
  }

  get(key) {
    return this.data[key];
  }

}

module.exports = Artifact;
