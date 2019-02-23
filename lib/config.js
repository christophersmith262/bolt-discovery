const fs = require('fs'),
  YAML = require('yaml'),
  file = fs.readFileSync('./config.yml', 'utf8'),
  config = YAML.parse(file);

module.exports = config;
