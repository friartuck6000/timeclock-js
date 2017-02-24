'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Concatenate and write arbitrary strings to stdout.
 *
 * @param  {...string}  things
 */
const write = exports.write = (...things) => {
  things.forEach(thing => {
    process.stdout.write(thing);
  });
};

/**
 * Same thing as __write, but adds a newline afterward.
 *
 * @param  {...string}  things
 */
const writeln = exports.writeln = (...things) => {
  write(...things);
  process.stdout.write('\n');
};

/**
 * Clears the current line.
 */
const clear = exports.clear = () => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};