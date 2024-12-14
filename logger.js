// Logs information messages
function logMessage(message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${message}`);
};

// Logs error messages
function logError(message, error) {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp}: ${message}`, error);
};

module.exports = { logMessage, logError };