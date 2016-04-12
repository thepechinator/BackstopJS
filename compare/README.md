## Development Process

From this directory, the `/compare` directory of the main BackstopJS project, 
you can run the following:

* `gulp` or `gulp build` to build an optimized version of your application in `/dist`
* `gulp serve` to launch a browser sync server on your source files
* `gulp serve:dist` to launch a server on your optimized application
* `gulp test` to launch your unit tests with Karma
* `gulp test:auto` to launch your unit tests with Karma in watch mode
* `gulp protractor` to launch your e2e tests with Protractor
* `gulp protractor:dist` to launch your e2e tests with Protractor on the dist files

## Port Info

TODO: Make this make more sense

Running `gulp serve` will start up the front-end compare app on port :3033. 
This should be the same port that is set up in the backstop config. This is
where requests from the Phalanx mocks will point to.

An important thing to keep in mind is that when `gulp serve` is running it will
proxy requests to port :3022 to hit up the Express app that runs the actual
comparisons on the back end. Therefore, if you want to run actual tests while
you are in developing mode for this front-end compare app, you want to run
`gulp start --report-port=3022` from the root of the BackstopJS project.