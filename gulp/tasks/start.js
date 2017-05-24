var gulp  = require('gulp');
var fs    = require('fs');
var spawn = require('child_process').spawn;
var isRunning = require('is-running');
var paths = require('../util/paths');
var argv  = require('yargs').argv;

// FORK for stopping the server.
// TODO: probably just leverage the 'stop' task to do this.
var exec  = require('child_process').exec;

// FORK grab report argument if there is one
var port = argv['report-port'] || paths.reportPort;

//THIS WILL START THE LOCAL WEBSERVER
//IF ALREADY STARTED IT WILL NOT TRY TO START AGAIN
gulp.task("start",function(cb){

  fs.readFile(paths.serverPidFile, function(err,data){

    if(data){
      // FORK: A bunch of logic that checks for the port from
      // the currently running process, and launches a
      // new server on a different port if the user
      // wants that.
      data = JSON.parse(data);
      var pid = parseInt(data.pid);
      var oldPort = data.port;

      // FORK: additional check
      if(!isRunning(pid) || oldPort !== port) {
        // FORK: Kill previous process and start a new one.
        exec('kill '+pid,function(error, stdout, stderr){
          console.log('Stopping previous server on port ' + oldPort + ' with PID:'+pid)
          fs.unlinkSync(paths.serverPidFile);

          start();
          cb();
        });
      } else {
        // FORK: display something to let the user know the
        // server is already running.
        console.log('Server already running! Check port ' + port);
        cb();
      }
    }else{
      start();
      cb();
    }

  });


  function start() {
    var time = (Number(argv.t) === argv.t && argv.t % 1 === 0) ? argv.t : 15;

    // FORK: also pass in the port for the server to use.
    var serverHook = spawn('node', ['server.js', '--t=' + time, '--report-port=' + port],  {detached: false, stdio:'inherit'});

    serverHook.unref();

    // FORK: Write json string in file so we can include the port number.
    fs.writeFileSync(paths.serverPidFile, JSON.stringify({pid: serverHook.pid, port: port}));
    console.log('\nServer launched in background on port ' + port + ' with PID: '+serverHook.pid);

    //if (time > 0) {
    //  console.log('NOTE: Server will auto-shutdown in ' + time + ' mins.\n');
    //} else {
    // console.log('NOTE: Server will run until you stop it with \'gulp stop\'.\n')
    //}

  }


});
