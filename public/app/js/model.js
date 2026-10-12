// View-model: turns a birth moment + "now" into the data the UI renders. Pure.

import {
  daysLived, hoursLived, roundJubilees, jubileeDate, isSoon, daysUntil,
} from './calc.js';

export const UNITS = ['days', 'hours'];

function currentOf(unit, birth, now) {
  return unit === 'days' ? daysLived(birth, now) : hoursLived(birth, now);
}

/**
 * @returns {{days: Section, hours: Section}} where Section =
 *   {unit, current, rows: [{key, unit, n, kind, date, soon, daysLeft}]}
 * `kind` is null for round jubilees.
 */
export function buildModel(birth, now) {
  const model = {};
  for (const unit of UNITS) {
    const current = currentOf(unit, birth, now);
    const rows = roundJubilees(current).map((n) => makeRow(unit, n, null, current, birth, now));
    model[unit] = { unit, current, rows };
  }
  return model;
}

export function makeRow(unit, n, kind, current, birth, now) {
  const date = jubileeDate(birth, unit, n);
  return {
    key: `${unit}:${n}`,
    unit,
    n,
    kind,
    date,
    soon: isSoon(unit, n, current),
    daysLeft: daysUntil(date, now),
  };
}
