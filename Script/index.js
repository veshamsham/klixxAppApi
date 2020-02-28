/* eslint-disable */
const childProcess = require('child_process');

function runScript(scriptPath, callback) {
  // keep track of whether callback has been invoked to prevent multiple invocations
  let invoked = false;
  const process = childProcess.fork(scriptPath);
  // listen for errors as they may prevent the exit event from firing
  process.on('error', err => {
    if (invoked) return;
    invoked = true;
    callback(err);
  });
  // execute the callback once the process has finished running
  process.on('exit', code => {
    if (invoked) return;
    invoked = true;
    const err = code === 0 ? null : new Error('exit code', code);
    callback(err);
  });
}
runScript('./Script/appConfig.js', err => {
  if (err) throw err;
  console.log('finished running appConfig.js');
});
runScript('./Script/superAdmin.js', err => {
  if (err) throw err;
  console.log('finished running superAdmin.js');
});

runScript('./Script/serverConfig.js', err => {
  if (err) throw err;
  console.log('finished running serverConfig.js');
});
// Now we can run a script and invoke a callback when complete, e.g.
runScript('./Script/admin.js', err => {
  if (err) throw err;
  console.log('finished running admin.js');
});
