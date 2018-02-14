const os = require('os');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;
const puppeteer = require('puppeteer');
const processes = new (require('./processes'));

/**
 * The Puppeteer API wrapper.
 *
 * With this class we provide a sneaky little wrapper around
 * the Puppeteer API from Google to ease modularized usage.
 */
class Puppeteer {

  /**
   * @constructor
   */
  constructor() {
    /**
     * The started browser instance
     * @type {?object}
     */
    this.browser = null;

    /**
     * The user data directory path
     * @type {string}
     */
    this.userDataDir = null;

    /**
     * The default cli argument list for start
     * @type {string[]}
     */
    this.arguments = [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--aggressive-cache-discard',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0',
      '--disable-dev-shm-usage'
    ];
  }

  /**
   * Launch Chromium instance with the help of puppeteer
   *
   * @returns {Promise}
   */
  launch() {
    // Create the temporary user data directory for Chromium
    this.userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfgen-'));

    // Start the Puppeteer instance and connect to the browser
    let promise = puppeteer
      .launch({
        headless: true,
        userDataDir: this.userDataDir,
        args: this.arguments
      })
      .then(async (browser) => {
        this.browser = browser;
        return browser;
      });

    return promise;
  }

  /**
   * Close the browser, with force and without mercy.
   */
  close() {
    // Do it the soft way
    if (this.browser) {
      this.browser.close();
      this.browser = null;
    }
    // Do it the hard way
    processes.kill(9, processes.grepChildren(/chrome/));
    // Cleanup the temporary user data directory
    execSync(`rm -rf ${this.userDataDir}`);
  }
};

module.exports = Puppeteer;
