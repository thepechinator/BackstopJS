const gulp = require('gulp');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const paths = require('../util/paths');
const argv = require('yargs').argv;

const portfinder = require('portfinder');

// FORK for stopping the server.
// TODO: probably just leverage the 'stop' task to do this.
const exec = require('child_process').exec;

// FORK grab report argument if there is one
const port = argv['report-port'] || paths.reportPort;
const processName = argv['process-name'] || 'backstopjs';
const maxServers = argv['max-servers'] || 1;

const shutoffPid = (pid) => {
  return new Promise((resolve) => {
    exec(`kill ${pid}`, () => {
      console.log(`Killing excess server on pid ${pid}`);
      resolve();
    });
  });
};

const removeExcessServers = (runningPids) => {
  const promises = [];

  if (runningPids.length >= maxServers) {
    // how much is it over?
    // +1 so we make room for the next process
    let removeCount = (-1 * (maxServers - runningPids.length)) + 1;
    console.info(`Removing ${removeCount} excess servers.`);

    while (removeCount) {
      const pid = runningPids.shift();
      promises.push(shutoffPid(pid));
      removeCount -= 1;
    }
  }

  return Promise.all(promises);
};

// THIS WILL START THE LOCAL WEBSERVER.
// IT WILL ALWAYS TERMINATE AN EXISTING RUNNING SERVER BEFORE STARTING
// UP ANOTHER ONE.
gulp.task('start', (cb) => {
  let serverConfigData = {};
  let runningPids = [];

  const start = () => {
    // Check for an open port, using the port argument as the default.
    portfinder.basePort = port;
    portfinder.getPortPromise()
      .then((port) => {
        // By default, let server run forever.
        const time = (Number(argv.t) === argv.t && argv.t % 1 === 0) ? argv.t : 0;

        // Run reporting server in detached mode.
        const serverHook = spawn('node', ['server.js', `--name=${processName}`, `--t=${time}`, `--report-port=${port}`], { detached: true, stdio: 'ignore' });

        // serverHook.stdout.on('data', (data) => {
        //   console.info('server.js output:', data.toString());
        // });

        // so the parent process doesn't wait for this process to exit before
        // continuing
        serverHook.unref();

        runningPids.push(serverHook.pid);
        // FORK: Write json string in file so we can include the port number.
        const jsonToWrite = Object.assign({}, serverConfigData, { runningPids, currentPort: port });
        fs.writeFileSync(paths.reportServerConfig, JSON.stringify(jsonToWrite));
        console.log(`\nServer launched in background on port ${port} with PID: ${serverHook.pid}`);
        cb();
      })
      .catch((err) => {
        console.error(err);
        cb();
      });
  };

  // Look for the previous pid, then kill it.
  // Restart on a new pid and store that in a file.
  fs.readJson(paths.reportServerConfig)
    .then((data) => {
      serverConfigData = data;
      runningPids = data.runningPids || [];
      return removeExcessServers(runningPids);
    })
    .then(() => {
      start();
    })
    .catch((err) => {
      console.info('error:', err);
      // check for specific code
      start();
    });
});
