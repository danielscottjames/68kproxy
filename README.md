# 68kproxy
This is a Proxy that allows very, very old browsers to surf the modern web.

I use this on my Macintosh Plus with 4MB of RAM, using [Mosaic 1.0.3](https://macintoshgarden.org/apps/ncsa-mosaic) or [MacWeb 2.0c](https://macintoshgarden.org/apps/macweb).

Mosaic supports images on the page, while MacWeb supports slightly more advanced HTML including forms. Neither supports JavaScript, CSS, etc... This proxy will pretty aggressively strip down webpages, if you are able to run a slightly newer browser but still need HTTP 1.x try using [WebOne](https://github.com/atauenis/webone) instead.

## Running an old Browser
If you want to try this out without an old computer, it's possible to install Mosaic on modern macOS and Linux, there are instructions [here](https://www.floodgap.com/retrotech/machten/mosaic/). On Linux try Snap: `sudo snap install mosaic`

## Features
* Strips page content with [Mozilla's Readability](https://github.com/mozilla/readability)
  * (AKA what Firefox uses for its Reader mode)
  * This can be disabled per page via the `[X]` link
* Uses ImageMagick to resize and convert images into [GIF87A](https://www.w3.org/Graphics/GIF/spec-gif87.txt) format
* Replace unicode with ascii equivalents (if possible)
* Etc...

## How to run

(Please note that this proxy is in no way secure and that you shouldn't view sensitive content via this proxy.)
### Initial Setup
* Setup [ImageMagick](https://imagemagick.org/script/download.php)
* Setup [NPM/Node](https://nodejs.org/en/download/)
* Then download the source files and run `npm install` from the source directory.


Once you've completed the initial setup, you can run it with `npm run start`. The console will output what IP and Port address to configure your browser's proxy with.

## Examples
![recording.gif](recording.gif)