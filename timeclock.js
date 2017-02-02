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

  init() {
    const _reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    let defaultName = ''

    last.read(this.state.filePath, 1)
      .then((line) => {
        console.log(0, line)
        csv.fromString(line)
          .on('data', (data) => {
            console.log(data[2])
            defaultName = data[2]
          })
      }, (bad) => {
        console.log(`Dis iz bad`)
      })

    _reader.question(`Task name [${defaultName}]: `, (answer) => {
      this.state.data = Object.assign(this.state.data, {
        start: new Date(),
        description: answer
      })
      this.run()
      _reader.close()
    })
  }

  run() {
    this._writeln(chalk.cyan('Doin stuff...'))
    this.finish()
  }

  finish() {
    this._writeln(chalk.green('All done'))
    this.state.data.end = new Date()

    console.log(this.state)
  }
}

let app = new App(yargs.argv)
app.init()


let initialize = (args) => {

  writeln('test')

  // Initialize I/O
  /*
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  */

  // Prompt for a description of the work you're about to do
  /*
  reader.question(`Bro, tell me:\n> `, (answer) => {

    const state = {
      path: args._[0] || process.cwd(),
      filename: FILENAME,
      data: {
        start: new Date(),
        end: null,
        description: answer
      }
    }

    run(state)
    reader.close()
  })
  */
}

let run = (state) => {
  // console.log(state)
  finish(state)
}

let finish = (state) => {
  console.log(state)
}
