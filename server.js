var express = require('express'),
    app     = express(),
    _       = require('underscore'),
    os      = require('os'),
    sys     = require('sys'),
    exec    = require('child_process').exec,
    spawn    = require('child_process').spawn, // TODO: combine this with above
    argv    = require('yargs').argv,
    //paths   = require('../util/paths'),
    fs      = require('fs');

fs.writeFileSync('current-test.txt', 'done');

//var autoShutDownMs = (Number(argv.t) === argv.t && argv.t % 1 === 0) ? 1000 * 60 * argv.t : 1000 * 60 * 60;
var rootDir = __dirname;

// FORK: Allow port to be configurable.
var port  = argv['report-port'] || 3001;

// console.info('ROOT DIR', rootDir);
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(rootDir));
app.use('/bitmaps_reference', express.static('../../test/css/bitmaps_reference'));
app.use('/bitmaps_test', express.static('../../test/css/bitmaps_test'));

// app.all('/app/',function(req,res){
//  console.log(new Date());
//  exec("gulp test",puts);
//  res.send('ok');
// })

app.post('/baseline', function(req, res) {

  // TODO: Make the string splitting and manipulation more robust
  // TODO: Add error handling
  var toBless = req.body.toBless;
  var status = toBless ? 'blessed' : 'fail';

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

    configObj.testPairs[configToUpdate].local_testStatus = status;

    fs.writeFile(configFileName, JSON.stringify(configObj, null, 2), function (err) {
      if (err) throw err;

      console.log('\n');
      if (toBless) {
        console.log('Blessed file received: ' + blessedDest);
        console.log('Moving to baseline reference directory, ready for version control');
      } else {
        console.log('File to Unbless received: ' + blessedDest);
        console.log('Reset to "fail" status');
        var clean_file = spawn('gulp', ['backstop:clean_file', '--file=' + blessedDest], {cwd: '../../'});
        clean_file.stdout.on('close', function (data) {
          console.log(blessedDest + ' no longer blessed for version control');
        });
        clean_file.stderr.on('data', function (data) {
          console.log('error: ', data.toString()); //wf
        });
      }
      console.log('Updating data (writing to ' + configFileName + ')');

      // respond with the index of the object to update on the client
      res.send({testPairToUpdate: configToUpdate});
    });
  });


});

// This receives and stores the test name and baseline boolean in a text file
// The /backstop request will read the data from this file
// TODO: see if this is even necessary
app.post('/backstop-test-prep', function(req, res) {
    var currentTest = fs.readFileSync('current-test.txt', 'utf8');
    if (currentTest === 'done') {
      console.log('Preparing to test: ', req.body.test_name);
      fs.writeFileSync('current-test.txt', JSON.stringify(req.body));
      console.log('Writing to current-test.txt');
      res.send('ok');
    } else {
      res.send({'status': 'busy'});
    }
});

// This fires off a gulp backstop task
// responds with a Server Sent Event
// so the stdout can be printed on the client page
app.get('/backstop', function(req, res) {

  // since you can't pass data to SSE, grab the tests to run
  // from current-test.txt
  var current_test_data = fs.readFileSync('current-test.txt', 'utf8');

  current_test_data = JSON.parse(current_test_data);

  fs.writeFileSync('current-test.txt', 'running');

  // array of options for spawn
  var gulpBackstopOptions = ['backstop'];

  // set options for gulp backstop command
  if (current_test_data.test_name === 'all') {
    gulpBackstopOptions.push('--path=ALL');
  } else  {
    gulpBackstopOptions.push('--name=' + current_test_data.test_name);
  }

  if (current_test_data.baseline) {
    gulpBackstopOptions.push('--baseline');
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-control": "no-cache"
  });

  var spw = spawn('gulp', gulpBackstopOptions, {cwd: '../../'});

  var str = '';

  spw.stdout.on('data', function (data) {
    str += data.toString();

    // Flush out line by line.
    var lines = str.split("\n");

    // this cleans up the string \n
    for (var i in lines) {
      if (i == lines.length - 1) {
        str = lines[i];
      } else {
        console.log(lines[i]);
        // Note: The double-newline is *required*
        res.write('data: ' + lines[i] + "\n\n");
      }
    }

  });

  spw.on('close', function (code) {
    if (code === 0) {
      res.write('event: done' + "\n");
      res.write('data: {"test_name": "TODO: Actually pass in uselful test_name"}' + '\n\n');
      fs.writeFileSync('current-test.txt', 'done');
      console.log('Done! Gulp backstop child process closed with code 0');
    } else {
      console.log('Gulp backstop child process FAILED to be killed.');
    }
    res.end(str);
  });

  // TODO: this will error if you uncomment, need to debug
  spw.stderr.on('data', function (data) {
    //res.end('stderr: ' + data);
  });

});

var listenerHook = app.listen(port);

//===================
console.log();
console.log('Current Directory: '+__dirname);
console.log('Serving files from: '+rootDir);
console.log('Listening on: ' + getAddresses() + ':' + port + '');
console.log('Press Ctrl + C to stop.');


/*if(autoShutDownMs>0){
  setTimeout(function(){
    console.log('\n['+new Date()+'] Server is shutting down now. Bye!\n');
    listenerHook.close();
  }, autoShutDownMs);

  console.log('\n['+new Date()+'] PLEASE NOTE: THIS SERVER WILL AUTOMATICALLY SHUT DOWN IN ' + Math.round(autoShutDownMs/60000 * 100) / 100+ ' MINS.\n')
}*/

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



