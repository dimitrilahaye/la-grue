'use strict';

// CJS shim for temporal-polyfill (ESM-only) used by Jest.
// Implements only the subset needed by parseDateTime in nantesMetropole.ts:
//   Temporal.PlainDateTime.from(isoStr).toZonedDateTime(tz) -> { epochMilliseconds }

const fmt = (timeZone) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

function getLocalParts(utcMs, timeZone) {
  const parts = fmt(timeZone).formatToParts(new Date(utcMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const h = get('hour');
  return {
    y: get('year'),
    mo: get('month'),
    d: get('day'),
    h: h === 24 ? 0 : h,
    mi: get('minute'),
    s: get('second'),
  };
}

function localIsoToEpochMs(isoLocalStr, timeZone) {
  const [datePart, timePart = '00:00'] = isoLocalStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);

  // Estimate UTC by treating local time as if it were UTC
  const utcEstimate = Date.UTC(year, month - 1, day, hour, minute, second);

  // Find offset at that estimate
  const p1 = getLocalParts(utcEstimate, timeZone);
  const offsetMs = utcEstimate - Date.UTC(p1.y, p1.mo - 1, p1.d, p1.h, p1.mi, p1.s);

  const result = utcEstimate + offsetMs;

  // Second pass to handle DST fold edges
  const p2 = getLocalParts(result, timeZone);
  const offsetMs2 = result - Date.UTC(p2.y, p2.mo - 1, p2.d, p2.h, p2.mi, p2.s);
  if (offsetMs2 !== offsetMs) {
    return utcEstimate + offsetMs2;
  }

  return result;
}

class ZonedDateTimeShim {
  constructor(epochMs) {
    this.epochMilliseconds = epochMs;
  }
}

class PlainDateTimeShim {
  constructor(isoStr) {
    this._isoStr = isoStr;
  }
  static from(str) {
    return new PlainDateTimeShim(str);
  }
  toZonedDateTime(tz) {
    return new ZonedDateTimeShim(localIsoToEpochMs(this._isoStr, tz));
  }
}

module.exports = {
  Temporal: {
    PlainDateTime: PlainDateTimeShim,
  },
};
