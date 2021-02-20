// @ts-check

const { Readability, isProbablyReaderable } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const FoldToAscii = require("fold-to-ascii");
const beautify = require('beautify');
const EXT_TO_MIME = require('./mime');
const RemoteConfig = require('./remoteconfig');

/** @param fetched {fetch.Response} */
module.exports = async (fetched) => {
    let url = fetched.url;
    let dom = new JSDOM(await fetched.text(), {
        url,
    });

    // List of transformers that will be applied in order
    const transformers = [
        tryConvertToReaderView,
        stripContent,
        horizontalizeMenu,
        resolveImgSrcset,
        stripHttpsLinks,
    ];

    dom = transformers.reduce((dom, transformer) => transformer(dom, url) || dom, dom);


    // Final passes are easier on raw HTML...
    let body = dom.serialize();
    body = FoldToAscii.foldReplacing(body);
    body = beautify(body, { format: 'html' });

    return [EXT_TO_MIME['html'], body];
}

/** 
 * Uses Mozilla's Readability parser to create a much simpler article.
 * The library exposes `isProbablyReaderable` which decides the default behavior.
 * 
 * @param dom {JSDOM} */
function tryConvertToReaderView(dom, url) {
    if (!isProbablyReaderable(dom.window.document)) {
        console.log(`${url} is probably not readable`);
    } else if (!RemoteConfig.allowReadability(url)) {
        console.log(`Reader view is disabled for: ${url}`);
    } else {
        if (isProbablyReaderable(dom.window.document) && RemoteConfig.allowReadability(url)) {
            let reader = new Readability(dom.window.document);
            let article = reader.parse();
            if (article) {
                const readableHTML = `<html>
<head>
  <title>${article.title}</title>
</head>
<body>
  <h1>${RemoteConfig.generateCommandLink(url, 'disableReadability', '[X]')} ${article.title}</h1>
  ${article.byline ? `<p>${article.byline}</p>` : ``}
<hr>
  ${article.content}
</body>
</html>`;

                dom = new JSDOM(readableHTML, { url });
            } else {
                console.log(`Failed to generate readable article for ${url}`)
            }
        }
    }

    return dom;
}

/** 
 * Inspired by: https://github.com/tghw/macproxy/blob/master/macify.py
 * @param dom {JSDOM} 
 * */
function stripContent(dom) {
    const document = dom.window.document;

    ['script', 'link', 'style', 'noscript'].forEach(tag => {
        [...document.getElementsByTagName(tag)].forEach(node => {
            node.remove();
        });
    });

    ['div', 'span'].forEach(tag => {
        [...document.getElementsByTagName(tag)].forEach(node => {
            node.replaceWith(...node.childNodes);
        });
    });
}

/** 
 * Turns short UL's that only contain links into P's
 * 
 * @param dom {JSDOM} */
function horizontalizeMenu(dom) {
    const CHARACTER_LIMIT = 160;
    const document = dom.window.document;

    [...document.getElementsByTagName('ul')].forEach(node => {
        /** @type {Element[]} */
        let links = [];
        const allLinks = [...node.children].every(child => {
            // TODO: could be smarter here
            const link = child.children[0];
            links.push(link);
            return link && link.tagName == 'A'
        });

        if (allLinks && (node.textContent || '').length < CHARACTER_LIMIT) {
            const p = document.createElement('p');
            links.forEach((l, i) => {
                p.appendChild(l);
                if (i < links.length - 1) {
                    p.appendChild(document.createTextNode(' '));
                }
            });
            node.replaceWith(p);
        }
    });
}

/** 
 * Some websites now use responsive srcset instead of src.
 * This picks an image from srcset and sets it as src.
 * 
 * @param dom {JSDOM} */
function resolveImgSrcset(dom) {
    const document = dom.window.document;

    [...document.getElementsByTagName('img')].forEach(img => {
        if (!img.src && img.srcset) {
            try {
                // TODO: be a lot smarter about which src to use
                img.src = img.srcset.split(', ')[0].split(' ')[0];
            } catch { }
        }
    });
}

/**
 * Change https links to http so they go through this proxy
 * 
 * @param dom {JSDOM} */
function stripHttpsLinks(dom) {
    const document = dom.window.document;

    [...document.getElementsByTagName('a')].forEach(node => {
        node.href && (node.href = node.href.replace(/^https:/, 'http:'));
    });

    [...document.getElementsByTagName('img')].forEach(node => {
        node.src && (node.src = node.src.replace(/^https:/, 'http:'));
    });
}
