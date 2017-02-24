'use strict';

require('babel-polyfill');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _fastCsv = require('fast-csv');

var _fastCsv2 = _interopRequireDefault(_fastCsv);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _sliceFile = require('slice-file');

var _sliceFile2 = _interopRequireDefault(_sliceFile);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _io = require('./io');

var io = _interopRequireWildcard(_io);

var _util = require('./util');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The name of the timesheet CSV file.
 *
 * @type  {string}  FILENAME
 */


// Local modules
const FILENAME = '_timesheet.csv';

/**
 * The time, in minutes, that is allowed before the timeclock is
 * automatically stopped.
 *
 * @type  {number}  TIMEOUT
 */


// Dependencieeeeeeeeeeees
const TIMEOUT = 30;

/**
 * Script state.
 *
 * @type  {Object}  state
 */
let state = {
  basePath: null,
  filePath: null,
  stream: null,
  timer: null,
  data: {
    start: null,
    end: null,
    description: ''
  }
};

// -----------------------------------------------------------------------------

/**
 * Displays the task description prompt.
 */
const showPrompt = () => {

  const _doPrompt = defaultValue => {
    let reader = _readline2.default.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    reader.question(_chalk2.default.cyan(`Task description [${defaultValue}]:\n`), value => {
      state.data = Object.assign(state.data, {
        start: new Date(),
        description: value || defaultValue
      });

      run();
      reader.close();
    });
  };

  // Try to load the most recent entry description to use for the next entry
  let lastLine = null;
  let lastDescription = null;
  let sliceable = (0, _sliceFile2.default)(state.filePath);
  sliceable.slice(-1).on('error', () => {
    _doPrompt('');
  }).on('data', buf => {
    if (lastLine !== null) sliceable.end();else lastLine = buf.toString();
  }).on('end', () => {
    let csvStream = _fastCsv2.default.fromString(lastLine);
    csvStream.on('data', data => {
      if (lastDescription !== null) csvStream.end();else lastDescription = data[2];
    }).on('end', () => {
      _doPrompt(lastDescription || '');
    });
  });
};

/**
 * Restart the idle timer.
 */
const startTimer = () => {
  clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    io.writeln(' > ', _chalk2.default.yellow(`No activity for ${TIMEOUT} minutes; stopping timeclock.`));
    finish();
  }, TIMEOUT * 60000);
};

/**
 * Initialize script.
 *
 * @param  {Object}  argv
 */
const init = argv => {
  state.basePath = argv._[0] || process.cwd();
  state.filePath = `${state.basePath}/${FILENAME}`;

  // Create write stream
  state.stream = _fs2.default.createWriteStream(state.filePath, { flags: 'a' });

  // Show prompt and start running
  showPrompt();
};

const run = () => {
  io.writeln(' > ', _chalk2.default.green(`You're on the clock...`));
  io.write(' > ');

  startTimer();
  _chokidar2.default.watch(`${state.basePath}/**/*`, { ignoreInitial: true }).on('all', (event, path) => {
    let relPath = path.replace(`${state.basePath}/`, '');
    io.clear();
    io.write(' > Latest change: ', _chalk2.default.magenta(relPath));
    startTimer();
  });

  process.on('SIGINT', () => {
    io.writeln();
    io.writeln(' > ', _chalk2.default.yellow('Stopping timeclock manually.'));
    finish();
  });
};

const finish = () => {
  state.data.end = new Date();
  console.log('all done');
  console.log(state.data);

  process.exit();
};

// -----------------------------------------------------------------------------

init(_yargs2.default.argv);