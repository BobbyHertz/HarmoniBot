// Dependency for Environment variables
require('dotenv').config();

let debugLoggingMode = 'off';

// Gets the Discord Login token.
function getDiscordToken() {
    return process.env.DISCORD_TOKEN;
};

// Gets the Bot Admin ID.
function getBotAdminId() {
    return process.env.BOT_ADMIN_ID;
};

// Gets the Debug Logging mode.
function getDebugLoggingMode() {
    return debugLoggingMode;
};

// Sets the Debug Logging mode.
function setDebugLoggingMode(value) {
    debugLoggingMode = value;
};

module.exports = {
    getDiscordToken,
    getBotAdminId,
    getDebugLoggingMode,
    setDebugLoggingMode
};