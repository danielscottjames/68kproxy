// @ts-check

const ip = require('ip');
const http = require('http');
const https = require('https');
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');
const EXT_TO_MIME = require('./mime');
const html = require('./html');
const gif = require('./gif');
const RemoteConfig = require('./remoteconfig');

const PORT = 8080;
const UA = `Mozilla/5.0 (Mobile; en-us) NCSA_Mosaic/1.0.3 (KHTML, like Gecko) Mobile`;

const agent = new https.Agent({
    // TODO: don't do this, but also, YOLO
    rejectUnauthorized: false,
});

// This wires up a function to handle each MIME type
/** @type {{
    [x: string]: (fetched: fetch.Response) => Promise<([string, string | Buffer])>;
}} */
const handlers = {
    [EXT_TO_MIME['html']]: html,
    [EXT_TO_MIME['jpeg']]: gif,
    [EXT_TO_MIME['png']]: gif,
    [EXT_TO_MIME['svg']]: gif,
    [EXT_TO_MIME['gif']]: gif,
};

const server = http.createServer(async function (request, response) {
    const result = {
        status: 500,
        /** @type {http.OutgoingHttpHeaders} */
        headers: {},
        /** @type {string | Buffer | undefined} */
        body: undefined,
    }

    // Can't change dead homepage so redirect here:
    if (request.url.includes('galaxy.einet.net/galaxy.html')) {
        response.writeHead(302, {
            'Location': 'http://en.m.wikipedia.org/wiki/MacWeb'
        });
        return response.end();
    }

    try {
        const parsedURL = new URL(request.url);
        if (parsedURL.hostname == '68kproxy.com') {
            const command = parsedURL.searchParams.get('command');
            const redirect = parsedURL.searchParams.get('redirect');

            if (command && redirect) {
                const decodedRedirect = decodeURIComponent(redirect);
                console.log(`Executing remote command: '${command}' then redirecting back to ${decodedRedirect}`);

                RemoteConfig[command] && RemoteConfig[command](decodedRedirect);

                response.writeHead(302, {
                    'Location': decodedRedirect.replace('https://', 'http://')
                });
                return response.end();
            }
        }
    } catch (e) {
        console.error(e);
    }

    try {
        console.log(`${request.method}: ${request.url}`);

        if (request.method != 'GET') {
            throw new Error(`Unsupported Method: ${request.method}`);
        }

        const url = request.url.replace('http://', 'https://');

        const headers = new Headers({
            'User-Agent': UA,
        });

        /** @type fetch.Response */
        const fetched = await fetch(url, {
            agent, headers, redirect: 'manual'
        });

        if (fetched.ok || fetched.status == 404) {

            let mime;
            try {
                mime = fetched.headers.get("Content-Type").split(';')[0];
            } catch {
                throw new Error(`Failed to parse Content-Type: ${fetched.headers.get("Content-Type")}`);
            }

            const handler = handlers[mime];
            if (handler) {
                const [rmime, rbody] = await handler(fetched);

                result.status = fetched.status;
                result.headers['Content-Type'] = rmime
                result.body = rbody;
            } else {
                throw new Error(`Unsupported Content-Type: ${mime};`);
            }
        } else if (fetched.status == 301 || fetched.status == 302) {
            const location = fetched.headers.get("Location").replace('https://', 'http://');

            result.status = fetched.status;
            result.headers['Location'] = location;
        } else {
            throw new Error(`Unhandled error, got HTTP status: ${fetched.status}`);
        }
    } catch (e) {
        console.error(e);
        result.status = 500;
        result.body = `${e}`;
    } finally {
        response.writeHead(result.status, result.headers);
        result.body && response.write(result.body);
        response.end();
    }
}).listen(PORT);

console.log(`Running proxy server @ ${ip.address()}:${PORT}`);