const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

const boltComponentSchema = mongoose.Schema({
  _id: String,
  name: String,
  version: String,
  definition: Mixed,
  latest: {ref: 'ComponentRelease', type: String},
  package: {ref: 'PackageRelease', type: String},
  release: {ref: 'Release', type: String},
});

const boltPackageSchema = mongoose.Schema({
  _id: String,
  name: String,
  version: String,
  components: [{ref: 'ComponentRelease', type: String}],
  latest: {ref: 'PackageRelease', type: String},
  release: {ref: 'Release', type: String},
});

const boltReleaseSchema = mongoose.Schema({
  _id: String,
  title: String,
  changelog: String,
  tag: String,
  branch: String,
  created: String,
  published: String,
  documentation: String,
  snapshot: String,
  packages: [{ref: 'PackageRelease', type: String}]
});

const Release = mongoose.model('Release', boltReleaseSchema);
const PackageRelease = mongoose.model('PackageRelease', boltPackageSchema);
const ComponentRelease = mongoose.model('ComponentRelease', boltComponentSchema);

module.exports = {
  'Release': Release,
  'PackageRelease': PackageRelease,
  'ComponentRelease': ComponentRelease,
};
