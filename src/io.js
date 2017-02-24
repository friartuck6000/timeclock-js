/**
 * Concatenate and write arbitrary strings to stdout.
 *
 * @param  {...string}  things
 */
export const write = (...things) => {
  things.forEach(thing => {
    process.stdout.write(thing);
  });
};

/**
 * Same thing as __write, but adds a newline afterward.
 *
 * @param  {...string}  things
 */
export const writeln = (...things) => {
  write(...things);
  process.stdout.write('\n');
};

/**
 * Clears the current line.
 */
export const clear = () => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};
