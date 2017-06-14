const path = require('path');
const fs = require('fs');
const argv = require('yargs').argv;

const paths = {};

// BACKSTOP MODULE PATH
paths.backstop = path.join(__dirname, '../..');

function getBackstopConfigFileName() {
  if (argv.backstopConfigFilePath) {
    const isAbsolutePath = argv.backstopConfigFilePath.charAt(0) === '/';
    const configPath = isAbsolutePath ? argv.backstopConfigFilePath : path.join(paths.backstop, argv.backstopConfigFilePath);
    if (!fs.existsSync(configPath)) {
      throw new Error('Couldn\'t resolve backstop config file');
    }
    return configPath;
  }
  return path.join(paths.backstop, '../../backstop.json');
}
// BACKSTOP CONFIG PATH
paths.backstopConfigFileName = getBackstopConfigFileName();

// FORK -- Store Port. Priority order:
// command argument > config > default
paths.reportPort = 3001;

// BITMAPS PATHS -- note: this path is overwritten if config files exist.  see below.
paths.bitmaps_reference = `${paths.backstop}/bitmaps_reference`;
paths.bitmaps_test = `${paths.backstop}/bitmaps_test`;

// COMPARE PATHS -- note: compareConfigFileName is overwritten if config files exist.  see below.
paths.comparePath = `${paths.backstop}/compare`;
paths.compareConfigFileName = `${paths.comparePath}/config.json`;
paths.compareReportURL = `http://localhost:${paths.reportPort}/compare/`;

// CAPTURE CONFIG PATHS
paths.captureConfigFileName = `${paths.backstop}/capture/config.json`;
paths.captureConfigFileNameCache = `${paths.backstop}/capture/.config.json.cache`;
paths.captureConfigFileNameDefault = `${paths.backstop}/capture/config.default.json`;

// SCRIPTS PATHS -- note: scripts is overwritten if config file exists.
paths.casper_scripts = null;
paths.casper_scripts_default = `${paths.backstop}/capture/casper_scripts`;

// SERVER CONFIG PATH
paths.reportServerConfig = argv['report-server-config'] || `${paths.backstop}/report-server-config.json`;

// ACTIVE CAPTURE CONFIG PATH
paths.activeCaptureConfigPath = '';

if (!fs.existsSync(paths.backstopConfigFileName)) {
  // console.log('\nCould not find a valid config file.');
  console.log(`\nCurrent config file location...\n ==> ${paths.backstopConfigFileName}`);
  console.log(`\n\`$ gulp genConfig\` generates a configuration boilerplate file in \`${paths.backstopConfigFileName}\`. (Will overwrite existing files.)\n`);
  paths.activeCaptureConfigPath = paths.captureConfigFileNameDefault;
} else {
  console.log('\nBackstopJS Config loaded at location', paths.backstopConfigFileName);
  paths.activeCaptureConfigPath = paths.backstopConfigFileName;
}

// overwrite default filepaths if config files exist
if (fs.existsSync(paths.activeCaptureConfigPath)) {
  const config = require(paths.activeCaptureConfigPath);
  if (config.paths) {
    paths.bitmaps_reference = config.paths.bitmaps_reference || paths.bitmaps_reference;
    paths.bitmaps_test = config.paths.bitmaps_test || paths.bitmaps_test;
    paths.compareConfigFileName = config.paths.compare_data || paths.compareConfigFileName;
    paths.casper_scripts = config.paths.casper_scripts || null;
  }

  // FORK -- Store Port. Priority order:
  // command argument > config > default
  if (config.reportPort) {
    paths.reportPort = config.reportPort;
  }

  if (argv['report-port']) {
    paths.reportPort = argv['report-port'];
  }
  paths.compareReportURL = `http://localhost:${paths.reportPort}/compare/`;

  paths.cliExitOnFail = config.cliExitOnFail || false;
  paths.casperFlags = config.casperFlags || null;
  paths.engine = config.engine || null;
  paths.report = config.report || null;
}

module.exports = paths;
