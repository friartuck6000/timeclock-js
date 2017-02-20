import 'babel-polyfill'

// Dependencieeeeeeeeeeees
import chalk from 'chalk'
import chokidar from 'chokidar'
import csv from 'fast-csv'
import fs from 'fs'
import last from 'read-last-lines'
import readline from 'readline'
import yargs from 'yargs'

// Set the filename that the CSV data should be written to
const FILENAME = '_timeclock.csv'

// Set the number of MINUTES of inactivity allowed before the timeclock
// automatically stops
const TIMEOUT = 30

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

    return this
  }

  _writeln() {
    this._write.apply(this, arguments)
    process.stdout.write('\n')

    return this
  }

  _clear() {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)

    return this
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
      this._writeln(' > ', chalk.yellow('Stopping timeclock due to inactivity.'))
      this.finish()
    }, TIMEOUT * 60000)
  }

  _roundMinutes(date, nearest, midpoint) {
    let actualMinutes = date.getMinutes()
    let remainder = actualMinutes % nearest
    let diff = nearest - remainder
    let rounded = remainder > midpoint
      ? actualMinutes + diff
      : actualMinutes - remainder

    date.setMinutes(rounded, 0, 0)

    return this
  }

  _saveCsv() {
    let fileStream = fs.createWriteStream(this.state.filePath, { flags: 'a' })
    let csvStream = csv()

    csvStream.transform((data) => {
      console.log(data)
      return [ 'a', 'b', 'c' ]
    })
    console.log('writin stuff')

    fileStream.on('finish', () => {
      console.log('dookie')
    })
    csvStream.on('finish', () => {
      console.log('aww fuck yeah, all done with the csv')
      fileStream.end()
    })

    csvStream.pipe(fileStream)
    // csvStream.write(['one', 'two', 'three'])
    csvStream.end()
  }

  init() {
    return this.shortCircuit()
    last.read(this.state.filePath, 1)
      .then((line) => {
        let csvStream = csv.fromString(line)
        let defaultName = ''
        csvStream.on('data', (data) => {
          defaultName = data[2]
          csvStream.end()
        })
        this._showPrompt(defaultName)
      }, (error) => {
        this._showPrompt('')
      })
  }

  shortCircuit() {
    let fileStream = fs.createWriteStream(this.state.filePath, { flags: 'a' })
    let csvStream = csv.createWriteStream({ headers: false })

    let now = Date.now()
    let data = {
      start: now,
      end: now + 60,
      description: 'Teeeest'
    }

    csvStream.on('finish', () => {
      fileStream.write('\n')
      fileStream.end()
    })

    csvStream.pipe(fileStream)
    csvStream.write(data)
    csvStream.end()
  }

  run() {
    this
      ._writeln(' > ', chalk.green(`You're on the clock...`))
      ._write(' > ')

    this._wait()
    chokidar.watch(`${this.state.path}/**/*`, {
      ignoreInitial: true
    }).on('all', (event, path) => {
      let relPath = path.replace(`${this.state.path}/`, '')
      this
        ._clear()
        ._write(' > Latest change: ', chalk.magenta(relPath))
      this._wait()
    })

    process.on('SIGINT', () => {
      this._writeln('\n > ', chalk.yellow('Clocking out manually.'))
      this.finish()

      return false
    })
  }

  finish() {
    this.state.data.end = new Date()

    // Round start/end to previous/next 15 minutes
    this
      ._roundMinutes(this.state.data.start, 15, 10)
      ._roundMinutes(this.state.data.end, 15, 5)

    this._saveCsv()

    process.exit()
  }
}

let app = new App(yargs.argv)
app.init()
