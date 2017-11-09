const Puppeteer = require(Suite.root('lib/puppeteer'));
const existsSync = require('fs').existsSync;

describe('Puppeteer Wrapper', function() {
  Suite.propperProcessTimeout(this);

  beforeEach(() => { this.puppeteer = new Puppeteer(); });
  afterEach(() => {
    // Close possible orphans and zombies
    try { this.puppeteer.close(); } catch (e) {}
    delete this.puppeteer;
  })

  describe('#launch', () => {
    it('starts a new chromium process', (done) => {
      this.puppeteer.launch().then(async (browser) => {
        const page = await browser.newPage();
        page.goto('file://' + Suite.fixture('simple.html'))
          .then(() => {
            expect(Suite.grepChildren(/chrome/, true)).not.to.be.empty();
          })
          .then(Suite.rescuePuppeteer(this.puppeteer, done))
          .catch(Suite.rescuePuppeteer(this.puppeteer, done));
      }).catch(done);
    });

    it('persists the browser instance', (done) => {
      expect(this.puppeteer.browser).to.be(null);
      this.puppeteer.launch()
        .then(async (browser) => {
          expect(this.puppeteer.browser).to.be(browser);
        })
        .then(Suite.rescuePuppeteer(this.puppeteer, done))
        .catch(Suite.rescuePuppeteer(this.puppeteer, done));
    });
  });

  describe('#close', () => {
    it('closes the browser instance down', (done) => {
      expect(Suite.grepChildren(/chrome/)).to.be.empty();
      this.puppeteer.launch()
        .then(async (browser) => {
          expect(Suite.grepChildren(/chrome/, true)).not.to.be.empty();
          this.puppeteer.close();
          expect(Suite.grepChildren(/chrome/)).to.be.empty();
        })
        .then(done)
        .catch(done);
    });

    it('removed the user data directory', (done) => {
      this.puppeteer.launch()
        .then(async (browser) => {
          expect(existsSync(this.puppeteer.userDataDir)).to.be(true);
        })
        .then(() => {
          this.puppeteer.close();
          expect(existsSync(this.puppeteer.userDataDir)).to.be(false);
        })
        .then(done)
        .catch(done);
    })
  });
});
