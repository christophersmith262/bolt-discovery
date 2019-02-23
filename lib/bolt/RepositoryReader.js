const fs = require('fs'),
  glob = require('glob'),
  path = require('path'),
  request = require('request'),
  shell = require('shelljs'),
  YAML = require('yaml'),
  config = require('../config'),
  Lock = require('../Lock.js');

class RepositoryReader {

  constructor(config) {
    this.lock = new Lock();
    this.config = config;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  getReleases() {
    return new Promise((accept, reject) => {

      function processReleases(body) {
        let releases = [];
        for (var i in body) {
          let release = body[i];
          if (release.draft || release.prerelease) {
            continue;
          }
          releases.push(release);
        }
        return releases;
      }

      request.get(config.git.releases, (error, response) => {
        if (error) {
          reject(error);
        }
        else {
          if (response.body.message) {
            reject(response.body.message);
          }
          else {
            accept(processReleases(response.body));
          }
        }
      });
    });
  }

  getPackages(version) {
    return this._critical((accept, reject) => {
      shell.pushd('-q', __dirname + '/../../' + this.config.git.clone.target);
      shell.exec('git checkout ' + version);

      let command = path.dirname(require.resolve('lerna')) + '/cli.js ls --json',
        rawPackages = JSON.parse(shell.exec(command, {silent: true}).stdout),
        packages = [];


      for (var i in rawPackages) {
        let rawPackage = rawPackages[i];

        if (rawPackage.private) {
          continue;
        }

        const searchPath = rawPackage.location + '/**/*.schema.yml',
          schemas = glob.sync(searchPath);

        let schemaDefinitions = {};
        for (var j in schemas) {
          const schemaPath = schemas[j],
            schema = YAML.parse(fs.readFileSync(schemaPath, 'utf8')),
            name = path.basename(schemaPath, '.schema.yml');
          
          schemaDefinitions[name] = schema;
        }

        rawPackage.definitions = schemaDefinitions;

        packages.push(rawPackage);
      }

      shell.popd('-q');
      accept(packages);
    });
  }

  _critical(callback) {
    const wrap = (f) => {
      const lock = this.lock;

      return function() {
        lock.release();
        f.apply(null, arguments);
      };
    }

    return new Promise((accept, reject) => {
      this.lock.acquire().then(() => {
        return this._ensure();
      }).then(() => {
        callback(wrap(accept), wrap(reject));
      }).catch((reason) => {
        wrap(reject)(reason);
      });
    });
  }

  _ensure() {
    return new Promise((accept, reject) => {

      const cloneAndRetry = () => {
        shell.exec('rm -rf ' + this.config.git.clone.target);
        shell.exec('git clone ' + this.config.git.clone.url + ' ' + this.config.git.clone.target);
        shell.popd('-q');
        this._ensure().then(accept);
      };

      this.retryCount++;

      if (this.retryCount > this.maxRetries) {
        reject("Failed to read the git repo after " + this.retryCount + " tries.");
      }

      shell.pushd('-q', __dirname + '/../../');
      shell.exec('rm -f ' + this.config.git.clone.target + '/.git/index.lock');

      fs.stat(this.config.git.clone.target, (err, stats) => {
        if (err) {
          return cloneAndRetry();
        }
        else {
          if (shell.pushd('-q', __dirname + '/../../' + this.config.git.clone.target).code) {
            return cloneAndRetry();
          }

          if (shell.exec('git fetch origin').code !== 0) {
            shell.popd('-q');
            return cloneAndRetry();
          }
          else {
            shell.popd('-q');
          }
        }

        shell.popd('-q');
        shell.pushd('-q', __dirname + '/../../' + this.config.git.clone.target);
        shell.exec('git fetch origin');
        shell.exec('git clean -f -d');
        shell.exec('git reset --hard HEAD');
        shell.popd('-q');
        this.retryCount = 0;
        accept();
      })
    });
  }

}

module.exports = RepositoryReader;
