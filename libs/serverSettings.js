// A global server array stores the settings for all servers.
let servers = [];

// Gets the saved settings for all servers.
function getAllSettings() {

    return servers;
};

// Gets the saved settings for a server. Default settings are returned if nothing has yet been saved.
function getSettings(serverId) {

    let index = getServerIndex(serverId);

    // Return the server's settings.
    return servers[index];
};

// Gets the prefix setting.
function getPrefix(serverId) {

    let index = getServerIndex(serverId);

    return servers[index].prefix;
};

// Sets the prefix setting.
function setPrefix(serverId, value) {

    let index = getServerIndex(serverId);

    servers[index].prefix = value;
};

// Gets the timeoutMinutes setting.
function getTimeoutMinutes(serverId) {

    let index = getServerIndex(serverId);

    return servers[index].timeoutMinutes;
};

// Sets the timeoutMinutes setting.
function setTimeoutMinutes(serverId, value) {

    let index = getServerIndex(serverId);

    servers[index].timeoutMinutes = value;
};

// Gets the inactivityTimeout setting.
function getInactivityTimeout(serverId) {

    let index = getServerIndex(serverId);

    return servers[index].inactivityTimeout;
};

// Sets the inactivityTimeout setting.
function setInactivityTimeout(serverId, value) {

    let index = getServerIndex(serverId);

    servers[index].inactivityTimeout = value;
};

// Gets the index of the saved server's settings. The server is added to the global server array if it is not in it.
function getServerIndex(serverId) {

    for (i = 0; i < servers.length; i++) {
        if (servers[i].id == serverId) {
            return i;
        }
    }

    return addServer(serverId);
};

// Adds a new server to the global server list.
function addServer(serverId) {

    var newServer =
    {
        id: serverId,
        prefix: '!',
        timeoutMinutes: 0,
        inactivityTimeout: null
    };

    servers.push(newServer);

    return servers.length - 1;
};

module.exports = {
    getAllSettings,
    getSettings,
    getPrefix,
    setPrefix,
    getTimeoutMinutes,
    setTimeoutMinutes,
    getInactivityTimeout,
    setInactivityTimeout
};