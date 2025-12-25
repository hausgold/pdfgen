const resolve = require('path').resolve;
const seconds = require('millis/seconds');
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const spawnSync = require('child_process').spawnSync;
const unlinkSync = require('fs').unlinkSync;
const readFileSync = require('fs').readFileSync;
const stream = require('stream');

// Added expect to the global context
global.expect = require('expect.js');

// Setup a global Suite object
global.Suite = Suite = {
  rootPath: resolve(__dirname, '..'),
  root: (path) => resolve(__dirname, '..', path),
  fixture: (path) => resolve(__dirname, 'fixtures', path),
  fixtureContent: (path) => readFileSync(Suite.fixture(path)).toString(),
  randomFloat: (min, max) => Math.random() * (max - min) + min
};

// Load and add process helpers from the library
const processes = new (require(Suite.root('lib/processes')));
Suite.tree = processes.tree;
Suite.children = processes.children;
Suite.grepChildren = processes.grepChildren;

// Set timeouts for a process launching tests
Suite.propperProcessTimeout = (ctx) => {
  ctx.timeout(seconds(30));
  ctx.slow(seconds(4));
};

// Rescue puppeteer test case (close the browser)
Suite.rescuePuppeteer = (puppeteer, done) => {
  return async (err) => { await puppeteer.close('rescue'); done(err); };
};

// Sleep process handling
let sleepSeed = Math.floor(Suite.randomFloat(1000, 30000));
let sleepIncrement = 0.0001;
let sleepId = sleepSeed + 0.1597;
let sleepPids = [];

// Spawn a new sleep command
Suite.spwanSleep = () => {
  // Increment the sleep seed to avoid conflicts
  sleepId += sleepIncrement;

  // Start a new sleep process, fully detached and forked
  let handle = spawn('/bin/sleep', [sleepId], {
    shell: false,
    detached: true,
    stdio: 'ignore'
  });

  // Persist the process id of the pid
  sleepPids.push(handle.pid);

  // Inject the sleep seed into the handle
  handle.id = sleepId;

  // Give back the handle
  return handle;
};

// Spawn a new sleepy, but do it later
Suite.spwanSleepLater = (delay = 2) => {
  // Increment the sleep seed to avoid conflicts
  sleepId += sleepIncrement;

  // Start a new sleep process, fully detached and forked
  let handle = spawn(Suite.fixture('node-delay'),
    [delay, '/bin/sleep', sleepId],
    {
      shell: false,
      detached: false
    });

  // Persist the process id of the pid
  sleepPids.push(handle.pid);

  // Inject the sleep seed into the handle
  handle.id = sleepId;

  // Give back a stub handle
  return { id: sleepId, pid: null };
};

// Kill them while they sleep
Suite.killSleeps = () => {
  // Filter out the pid we were able to kill
  sleepPids = sleepPids.filter((pid) => {
    // Kill the process with force
    for (let i = 1; i <= 10; i++) {
      try { execSync(`ps xao pid,command \
        | grep -v '<defunct>' \
        | grep -v grep \
        | grep ${sleepSeed} \
        | sed 's/^\\s\\+//g' \
        | sed 's/\\s\\s*/ /g' \
        | awk '{print $1}' \
        | xargs -n1 kill -9`, { stdio: 'ignore' }); }
      catch (e) { break; }
    }

    // Check the process
    try {
      execSync(`ps xao pid,command \
        | grep -v '<defunct>' \
        | grep -v 'grep' \
        | grep '${pid}'`)
      // If we reach this line, the process is alive
      return true;
    } catch (e) {
      // If we reach this line, the process is dead
      return false;
    }
  });

  // Double check our cleanup
  expect(sleepPids).to.be.empty();
};

// Capture the output of a command
Suite.capture = (command) => {
  let output = '';

  try {
    output = spawnSync(command, {
      shell: true
    }).output.join('').trim();
  } catch (e) { console.log(e); }

  return output.toString().trim();
};

// Capture the return code of a command
Suite.exitCode = (command) => {
  try { execSync(command); } catch (e) { return e.status; }
  return 0;
};

// This function delivers the rmse error percentage.
// When the images are fully equal the error percentage will be zero.
Suite.comparePdfWithPng = (pdf, png) => {
  // Generate a temporary file name for the pdf in question
  let actual = pdf.replace(/\.pdf$/, '.png');
  let pdf2png = Suite.root(`exe/pdf2png`);
  let imgdiff = Suite.root(`exe/imgdiff`);

  // Convert PDF file to PNG first
  execSync(`${pdf2png} "${pdf}" "${actual}"`);

  // Calculate the rmse error percentage
  let output = Suite.capture(`${imgdiff} "${actual}" "${png}"`);

  // Log out the difference for debugging
  console.log(`          \u001B[90m⇒ ${output}% difference\u001B[0m`);

  // Parse the difference percentage
  return parseFloat(output);
};

// Start the test server (header echo).
Suite.startTestServer = () => {
  Suite.testServerHandle = spawn(Suite.root('exe/test-server'), [], {
    shell: false,
    detached: false,
    stdio: 'ignore'
  });
};

// Stop the test server.
Suite.stopTestServer = () => {
  Suite.testServerHandle.kill('SIGKILL');
};
