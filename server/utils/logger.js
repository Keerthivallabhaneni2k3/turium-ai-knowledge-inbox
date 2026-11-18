
const log = (level, event, details = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else {
    console.log(output);
  }
};

module.exports = {
  info: (event, details) => log("info", event, details),
  warn: (event, details) => log("warn", event, details),
  error: (event, details) => log("error", event, details),
};