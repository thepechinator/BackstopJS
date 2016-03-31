var express = require('express'),
    app     = express(),
    _       = require('underscore'),
    os      = require('os'),
    sys     = require('sys'),
    exec    = require('child_process').exec,
    argv    = require('yargs').argv,
    //paths   = require('../util/paths'),
    fs      = require('fs');

var autoShutDownMs = (Number(argv.t) === argv.t && argv.t % 1 === 0) ? 1000 * 60 * argv.t : 1000 * 60 * 15;
var rootDir = __dirname;

// FORK: Allow port to be configurable.
var port  = argv['report-port'] || 3001;

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(rootDir));

// app.all('/app/',function(req,res){
//  console.log(new Date());
//  exec("gulp test",puts);
//  res.send('ok');
// })

app.post('/baseline', function(req, res) {
  
  // TODO: Make the string splitting and manipulation more robust
  // TODO: Add error handling
  var blessed = req.body.blessed.split('.././bitmaps_test/')[1];
  var blessedDest = blessed.split('/')[1];

  // move the blessed image to the bitmaps_refernce
  fs.createReadStream('bitmaps_test/' + blessed).pipe(fs.createWriteStream('bitmaps_reference/' + blessedDest));

  // update the config.json to reflect status of blessed
  var configFileName = 'compare/config.json';
  var configToUpdate = req.body.index;
  var configObj;

  fs.readFile(configFileName, 'utf8', function (err, data) {
    if (err) throw err;
    configObj = JSON.parse(data);

    configObj.testPairs[configToUpdate].local_testStatus = 'blessed';

    fs.writeFile(configFileName, JSON.stringify(configObj, null, 2), function (err) {
      if (err) throw err;
      console.log('Blessed file received: ' + blessedDest);
      console.log('Moving to baseline reference directory'); 
      console.log('Updating data (writing to ' + configFileName + ')');

      // respond with the index of the object to update on the client
      res.send({testPairToUpdate: configToUpdate});
    });
  });

});

var listenerHook = app.listen(port);

//===================
console.log();
console.log('Current Directory: '+__dirname);
console.log('Serving files from: '+rootDir);
console.log('Listening on: ' + getAddresses() + ':' + port + '');
console.log('Press Ctrl + C to stop.');


if(autoShutDownMs>0){
  setTimeout(function(){
    console.log('\n['+new Date()+'] Server is shutting down now. Bye!\n');
    listenerHook.close();
  }, autoShutDownMs);

  console.log('\n['+new Date()+'] PLEASE NOTE: THIS SERVER WILL AUTOMATICALLY SHUT DOWN IN ' + Math.round(autoShutDownMs/60000 * 100) / 100+ ' MINS.\n')
}

//=====================
function getAddresses(){
  var interfaces = os.networkInterfaces(),
    addresses = [];

  _.each(interfaces,function(net) {
    _.each(net,function(address) {
      if (address.family == 'IPv4' && !address.internal) addresses.push(address.address);
    });
  });

  return addresses;
}

function puts(error, stdout, stderr) {sys.puts(stdout)}



