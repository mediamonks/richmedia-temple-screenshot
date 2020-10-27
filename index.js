const puppeteer = require("puppeteer");
const httpServer = require("http-server/lib/http-server");
const portfinder = require("portfinder");

/**
 *
 * @param {string} url
 * @param {any} config
 * @param {string} location
 * @param {string} selector
 * @param {object} clip
 * @param {number} clip.width
 * @param {number} clip.height
 * @param {number} clip.x
 * @param {number} clip.y
 * @param {string} waitUntil
 * @return {Promise<void>}
 */
async function fromUrl({
  url,
  config = {},
  location,
  clip = null,
  selector = null,
  clip = null,
  waitUntil = "load"
}) {
  const padding = 0;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil });
  let rect = null;

  if (selector !== null) {
    rect = await page.evaluate((selector,clip) => {
      const element = document.querySelector(selector);

      if (!element) {
        return clip;
      }

      const { x, y, width, height } = element.getBoundingClientRect();
      return {x, y, width, height };
    }, selector,clip);
  } else {
    rect = clip
  }

  const settings = {
    path: location
  };

  if (rect) {
    settings.clip = rect;
  }

  await page.screenshot(settings);
  await browser.close();
}

/**
 *
 * @param {string} filepath
 * @param {any} config
 * @param {string} location
 * @param {object} clip
 * @param {number} clip.x
 * @param {number} clip.y
 * @param {number} clip.width
 * @param {number} clip.height
 * @return {Promise<void>}
 */
async function fromPath({ filepath, config, location, clip = null }) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const port = await portfinder.getPortPromise();

  const server = httpServer.createServer({
    root: filepath
  });

  server.listen(port, "0.0.0.0", function() {});

  await page.goto(`http://localhost:${port}`);

  const settings = { path: location };

  if (clip) {
    settings.clip = clip;
  }

  await page.screenshot(settings);
  server.close();
  await browser.close();
}

async function fromElement({ selector, filepath, config, location }) {
  const padding = 0;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const port = await portfinder.getPortPromise();

  const server = httpServer.createServer({
    root: filepath
  });

  server.listen(port, "0.0.0.0", function() {});

  await page.goto(`http://localhost:${port}`);

  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    const { x, y, width, height } = element.getBoundingClientRect();
    return { left: x, top: y, width, height, id: element.id };
  }, selector);

  const settings = {
    path: location,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  };

  await page.screenshot(settings);
  server.close();
  await browser.close();
}

module.exports.fromUrl = fromUrl;
module.exports.fromPath = fromPath;
module.exports.fromElement = fromElement;
