"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Round the given date to the closest multiple of <nearest>, based on the
 * given <midpoint>.
 *
 * @param  {Date}    date
 * @param  {number}  nearest
 * @param  {number}  midpoint
 */
const roundMinutes = exports.roundMinutes = (date, nearest, midpoint) => {
  let realMinutes = date.getMinutes();
  let remainder = realMinutes % nearest;
  let diff = nearest - remainder;
  let rounded = remainder > midpoint ? realMinutes + diff : realMinutes - remainder;

  date.setMinutes(rounded, 0, 0);
};