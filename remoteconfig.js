// @ts-check

const { httpsToHttp } = require('./url');

/** @type Set<string> */
let readabilityOverride = new Set();

/** @param url {string} */
function allowReadability(url) {
    url = httpsToHttp(url);
    return !readabilityOverride.has(url);
}

/** @param url {string} */
function disableReadability(url) {
    url = httpsToHttp(url);
    return readabilityOverride.add(url);
}

/** @param url {string} */
function enableReadability(url) {
    url = httpsToHttp(url);
    return readabilityOverride.delete(url);
}

/** 
 * Generate a fake <a> that will toggle behavior and redirect back to the specified page
 * 
 * @param url {string}
 * @param command {string}
 * @param text {string}
 *  */
function generateCommandLink(url, command, text) {
    url = httpsToHttp(url);
    return `<a href="http://68kproxy.com/?command=${command}&redirect=${encodeURIComponent(url)}">${text}</a>`;
}

module.exports = {
    allowReadability, disableReadability, enableReadability, generateCommandLink
}