import 'babel-polyfill'

// Dependencieeeeeeeeeeees
import chalk from 'chalk'
import chokidar from 'chokidar'
import csv from 'fast-csv'
import fs from 'fs'
import readline from 'readline'
import slice from 'slice-file'
import yargs from 'yargs'

// Local modules
import * as io from './io'
import { roundMinutes } from './util'
/**
 * The name of the timesheet CSV file.
 *
 * @type  {string}  FILENAME
 */
const FILENAME = '_timesheet.csv'

/**
 * The time, in minutes, that is allowed before the timeclock is
 * automatically stopped.
 *
 * @type  {number}  TIMEOUT
 */
const TIMEOUT = 30

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
}

// -----------------------------------------------------------------------------

/**
 * Displays the task description prompt.
 */
const showPrompt = () => {

  const _doPrompt = (defaultValue) => {
    let reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    reader.question(
      chalk.cyan(`Task description [${defaultValue}]:\n`),
      (value) => {
        state.data = Object.assign(state.data, {
          start: new Date(),
          description: value || defaultValue
        })

        run()
        reader.close()
      }
    )
  }

  // Try to load the most recent entry description to use for the next entry
  let lastLine = null
  let lastDescription = null
  let sliceable = slice(state.filePath)
  sliceable
    .slice(-1)
    .on('error', () => {
      _doPrompt('')
    })
    .on('data', (buf) => {
      if (lastLine !== null) sliceable.end()
      else lastLine = buf.toString()
    })
    .on('end', () => {
      let csvStream = csv.fromString(lastLine)
      csvStream
        .on('data', (data) => {
          if (lastDescription !== null) csvStream.end()
          else lastDescription = data[2]
        })
        .on('end', () => {
          _doPrompt(lastDescription || '')
        })
    })
}

/**
 * Restart the idle timer.
 */
const startTimer = () => {
  clearTimeout(state.timer)
  state.timer = setTimeout(() => {
    io.writeln(' > ', chalk.yellow(`No activity for ${TIMEOUT} minutes; stopping timeclock.`))
    finish()
  }, TIMEOUT * 60000)
}

/**
 * Initialize script.
 *
 * @param  {Object}  argv
 */
const init = (argv) => {
  state.basePath = argv._[0] || process.cwd()
  state.filePath = `${state.basePath}/${FILENAME}`

  // Create write stream
  state.stream = fs.createWriteStream(state.filePath, { flags: 'a' })

  // Show prompt and start running
  showPrompt()
}

const run = () => {
  io.writeln(' > ', chalk.green(`You're on the clock...`))
  io.write(' > ')

  startTimer()
  chokidar.watch(`${state.basePath}/**/*`, { ignoreInitial: true })
    .on('all', (event, path) => {
      let relPath = path.replace(`${state.basePath}/`, '')
      io.clear()
      io.write(' > Latest change: ', chalk.magenta(relPath))
      startTimer()
    })

  process.on('SIGINT', () => {
    io.writeln()
    io.writeln(' > ', chalk.yellow('Stopping timeclock manually.'))
    finish()
  })
}

const finish = () => {
  state.data.end = new Date()
  console.log('all done')
  console.log(state.data)

  process.exit()
}

// -----------------------------------------------------------------------------

init(yargs.argv)
