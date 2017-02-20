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

var _readLastLines = require('read-last-lines');

var _readLastLines2 = _interopRequireDefault(_readLastLines);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Set the filename that the CSV data should be written to
const FILENAME = '_timeclock.csv';

// Set the number of MINUTES of inactivity allowed before the timeclock
// automatically stops


// Dependencieeeeeeeeeeees
const TIMEOUT = 30;

let state = {
  path: null,
  filename: FILENAME,
  filePath: null,
  data: {
    start: null,
    end: null,
    description: null
  }
};

// App object
class App {
  /**
   * Constructor; initializes state.
   *
   * @param  {Object}  argv
   */
  constructor(argv) {
    this.state = Object.assign({}, state, {
      path: argv._[0] || process.cwd()
    });
    this.state.filePath = `${this.state.path}/${this.state.filename}`;
    this.waitTimeout = null;
  }

  _write() {
    let args = Array.prototype.slice.call(arguments);
    args.forEach(msg => {
      process.stdout.write(msg);
    });

    return this;
  }

  _writeln() {
    this._write.apply(this, arguments);
    process.stdout.write('\n');

    return this;
  }

  _clear() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    return this;
  }

  _showPrompt(defaultName) {
    const reader = _readline2.default.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    reader.question(_chalk2.default.cyan(`Task name [${defaultName}]: `), name => {
      this.state.data = Object.assign(this.state.data, {
        start: new Date(),
        description: name || defaultName
      });
      this.run();
      reader.close();
    });
  }

  _wait() {
    clearTimeout(this.waitTimeout);
    setTimeout(() => {
      this._writeln(' > ', _chalk2.default.yellow('Stopping timeclock due to inactivity.'));
      this.finish();
    }, TIMEOUT * 60000);
  }

  _roundMinutes(date, nearest, midpoint) {
    let actualMinutes = date.getMinutes();
    let remainder = actualMinutes % nearest;
    let diff = nearest - remainder;
    let rounded = remainder > midpoint ? actualMinutes + diff : actualMinutes - remainder;

    date.setMinutes(rounded, 0, 0);

    return this;
  }

  _saveCsv() {
    let fileStream = _fs2.default.createWriteStream(this.state.filePath, { flags: 'a' });
    let csvStream = (0, _fastCsv2.default)();

    csvStream.transform(data => {
      console.log(data);
      return ['a', 'b', 'c'];
    });
    console.log('writin stuff');

    fileStream.on('finish', () => {
      console.log('dookie');
    });
    csvStream.on('finish', () => {
      console.log('aww fuck yeah, all done with the csv');
      fileStream.end();
    });

    csvStream.pipe(fileStream);
    // csvStream.write(['one', 'two', 'three'])
    csvStream.end();
  }

  init() {
    return this.shortCircuit();
    _readLastLines2.default.read(this.state.filePath, 1).then(line => {
      let csvStream = _fastCsv2.default.fromString(line);
      let defaultName = '';
      csvStream.on('data', data => {
        defaultName = data[2];
        csvStream.end();
      });
      this._showPrompt(defaultName);
    }, error => {
      this._showPrompt('');
    });
  }

  shortCircuit() {
    let fileStream = _fs2.default.createWriteStream(this.state.filePath, { flags: 'a' });
    let csvStream = _fastCsv2.default.createWriteStream({ headers: false });

    let now = Date.now();
    let data = {
      start: now,
      end: now + 60,
      description: 'Teeeest'
    };

    csvStream.on('finish', () => {
      fileStream.write('\n');
      fileStream.end();
    });

    csvStream.pipe(fileStream);
    csvStream.write(data);
    csvStream.end();
  }

  run() {
    this._writeln(' > ', _chalk2.default.green(`You're on the clock...`))._write(' > ');

    this._wait();
    _chokidar2.default.watch(`${this.state.path}/**/*`, {
      ignoreInitial: true
    }).on('all', (event, path) => {
      let relPath = path.replace(`${this.state.path}/`, '');
      this._clear()._write(' > Latest change: ', _chalk2.default.magenta(relPath));
      this._wait();
    });

    process.on('SIGINT', () => {
      this._writeln('\n > ', _chalk2.default.yellow('Clocking out manually.'));
      this.finish();

      return false;
    });
  }

  finish() {
    this.state.data.end = new Date();

    // Round start/end to previous/next 15 minutes
    this._roundMinutes(this.state.data.start, 15, 10)._roundMinutes(this.state.data.end, 15, 5);

    this._saveCsv();

    process.exit();
  }
}

let app = new App(_yargs2.default.argv);
app.init();