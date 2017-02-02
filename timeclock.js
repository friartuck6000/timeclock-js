// Dependencieeeeeeeeeeees
const chalk    = require('chalk')
const chokidar = require('chokidar')
const csv      = require('fast-csv')
const fs       = require('fs')
const last     = require('read-last-lines')
const readline = require('readline')
const yargs    = require('yargs')

// Set the filename that the CSV data should be written to
const FILENAME = '_timeclock.csv'

// Set the number of MINUTES of inactivity allowed before the timeclock
// automatically stops
const TIMEOUT = 1

let state = {
  path: null,
  filename: FILENAME,
  filePath: null,
  data: {
    start: null,
    end: null,
    description: null
  }
}

// App object
class App {
  /**
   * Constructor; initializes state.
   *
   * @param  {Object}  argv
   */
  constructor(argv) {
    this.state = Object.assign({}, state, {
      path: argv._[0] || process.cwd(),
    })
    this.state.filePath = `${this.state.path}/${this.state.filename}`
    this.waitTimeout = null
  }

  _write() {
    let args = Array.prototype.slice.call(arguments)
    args.forEach((msg) => {
      process.stdout.write(msg)
    })
  }

  _writeln() {
    this._write.apply(this, arguments)
    process.stdout.write('\n')
  }

  _showPrompt(defaultName) {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    reader.question(chalk.cyan(`Task name [${defaultName}]: `), (name) => {
      this.state.data = Object.assign(this.state.data, {
        start: new Date(),
        description: name || defaultName
      })
      this.run()
      reader.close()
    })
  }

  _wait() {
    clearTimeout(this.waitTimeout)
    setTimeout(() => {
      this._writeln(chalk.yellow('\nStopping timeclock due to inactivity.'))
      this.finish()
    }, TIMEOUT * 60000)
  }

  init() {
    last.read(this.state.filePath, 1)
      .then((line) => {
        csv.fromString(line)
          .on('data', (data) => {
            this._showPrompt(data[2])
          })
      }, (error) => {
        this._showPrompt('')
      })
  }

  run() {
    this._wait()
    chokidar.watch(this.state.path, (e, p) => {
      console.log(e, p)
      this._wait()
    })

    process.on('SIGINT', () => {
      this._writeln(chalk.yellow('\nStopping timeclock manually.'))
      this.finish()
    })
  }

  finish() {
    this.state.data.end = new Date()
    let _d = this.state.data.end

    console.log(`Before:`, chalk.green(_d))

    // 8:00 -> 8:00
    // 8:01 -> 8:00
    // 8:05 -> 8:15
    process.exit()
  }
}

let app = new App(yargs.argv)
app.init()
