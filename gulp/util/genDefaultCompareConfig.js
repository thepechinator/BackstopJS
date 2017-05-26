const fsx = require('fs-extra');
const paths = require('./paths');


const configDefault = {
  testPairs: [],
};

const genDefaultCompareConfig = function () {
  fsx.ensureFileSync(paths.compareConfigFileName);
  fsx.writeFileSync(paths.compareConfigFileName, JSON.stringify(configDefault, null, 2));
};

module.exports = genDefaultCompareConfig;
