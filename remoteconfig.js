// @ts-check

/** @type Set<string> */
let readabilityOverride = new Set();

/** @param url {string} */
function allowReadability(url) {
    return !readabilityOverride.has(url);
}

/** @param url {string} */
function disableReadability(url) {
    return readabilityOverride.add(url);
}

/** @param url {string} */
function enableReadability(url) {
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
    return `<a href="http://68kproxy.com/?command=${command}&redirect=${encodeURIComponent(url)}">${text}</a>`;
}

module.exports = {
    allowReadability, disableReadability, enableReadability, generateCommandLink
}