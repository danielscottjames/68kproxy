// @ts-check

const fetch = require('node-fetch');
const tmp = require('tmp-promise');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const EXT_TO_MIME = require('./mime');

const MAX_IMAGE_SIZE = "512x342"; // Resolution of Macintosh Plus
const IMAGE_BACKGROUND = "#bfbfbf"; // Background of Mosaic

/** @param fetched {fetch.Response} */
module.exports = async (fetched) => {
    const { fd, path, cleanup } = await tmp.file();
    try {
        const img = await fetched.buffer();
        await util.promisify(fs.writeFile)(fd, img);

        const command = `convert ${path} -background "${IMAGE_BACKGROUND}" -alpha remove -alpha off -resize ${MAX_IMAGE_SIZE}\\\> gif87:${path}`;
        console.log(command);
        const { stdout, stderr } = await exec(command);
        stdout && console.log(stdout);
        stderr && console.log(stderr);

        return [EXT_TO_MIME['gif'], await util.promisify(fs.readFile)(path)];
    } finally {
        cleanup();
    }
}