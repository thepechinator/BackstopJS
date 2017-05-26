const paths = require('../util/paths');
const fs = require('fs');

const config = require(paths.activeCaptureConfigPath);
// Serialize config as JSON into capture config.
fs.writeFileSync(paths.captureConfigFileName, JSON.stringify(config));
