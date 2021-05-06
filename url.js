// @ts-check

/** @param url {string} */
function httpsToHttp(url) {
    return url.replace(/^https:/, 'http:');
}

/** @param url {string} */
function httpToHttps(url) {
    return url.replace(/^http:/, 'https:');
}

module.exports = { httpsToHttp, httpToHttps }