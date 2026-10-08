const { toZonedTime, fromZonedTime } = require('date-fns-tz');

try {
  const cutoffStr = "2026-10-08T21:00:00";
  const utcDate = fromZonedTime(cutoffStr, 'Asia/Kolkata');
  console.log("fromZonedTime:", utcDate.toISOString());
} catch(e) {
  console.error(e);
}
