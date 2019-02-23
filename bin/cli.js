#!/usr/bin/env node

const ArgumentParser = require('argparse').ArgumentParser,
  bolt = require('../lib/bolt'),
  config = require('../lib/config'),
  database = require('../lib/database'),
  models = require('../lib/models');

const parser = new ArgumentParser({
  addHelp: true,
  description: 'Builds the database of bolt metadata.',
});

parser.addArgument(
  ['-v', '--verbose'],
  {
    defaultValue: false,
    help: 'Print verbose debugging messages to stdout.',
    nargs: 0,
    action: 'storeTrue',
  }
);

const args = parser.parseArgs(),
  reader = new bolt.RepositoryReader(config),
  writer = new database.MongooseWriter;

database.connect().then(() => {
  reader.getReleases().then((releases) => {
    return writer.writeList(models.Release, releases, (artifact, release) => {
      artifact.dependsOn(reader.getPackages(release.tag_name).then((packages) => {
        return writer.writeList(models.PackageRelease, packages, (artifact, pkg) => {
          artifact.dependsOn(writer.writeList(models.ComponentRelease, pkg.definitions, (artifact, definition, name) => {
            const id = name + ':' + release.tag_name;
            console.log("Writing component-release: " + id);
            artifact.set({
              id: id,
              attributes: {
                name: name,
                version: pkg.version,
                definition: database.MongooseWriter.cleanKeys(definition),
                package: pkg.name + ':' + release.tag_name,
                release: release.tag_name,
              },
            });
          }).dependency((transaction) => {
            const id = pkg.name + ':' + release.tag_name;
            console.log("Writing package-release: " + id);

            artifact.set({
              id: id,
              attributes: {
                name: pkg.name,
                version: pkg.version,
                components: transaction.completedIds,
                release: release.tag_name,
              },
            });
          }));
        }).dependency((transaction) => {
          console.log("Writing release: " + release.tag_name);

          artifact.set({
            id: release.tag_name,
            attributes: {
              title: release.name,
              changelog: release.body,
              tag: release.tag_name,
              branch: release.target_commitish,
              documentation: 'https://' + release.tag_name.replace(/\./g, '-') + '.boltdesignsystem.com',
              created: release.created_at,
              published: release.published_at,
              snapshot: release.tarball_url,
              packages: transaction.completedIds,
            },
          });
        });
      }));
    }).dependency((transaction) => {
      console.log("Finished writing releases.");
      process.exit();
    });
  });
});
