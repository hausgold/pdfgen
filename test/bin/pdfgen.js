const binary = Suite.root('bin/pdfgen');
const meta = require(Suite.root('package.json'));
const unlinkSync = require('fs').unlinkSync;
const existsSync = require('fs').existsSync;
const readFileSync = require('fs').readFileSync;

describe('pdfgen Binary', function() {
  Suite.propperProcessTimeout(this);

  let validUrl = 'file://' + Suite.fixture('simple.html');
  let validUrlBrokenHtml = 'file://' + Suite.fixture('broken.html');
  let invalidUrl = 'http://broken.tld';
  let outputDest = (filename) => {
    if (!filename) { return Suite.root(`test/tmp/test.pdf`) }
    return Suite.root(`test/tmp/${filename}.pdf`)
  };
  let pdf = outputDest();
  let cleanup = () => {
    if (existsSync(pdf)) { unlinkSync(pdf); }
  };

  // Comment when recording new comparison fixtures
  beforeEach(cleanup);
  afterEach(cleanup);

  describe('--version', () => {
    it('prints the current binary version', () => {
      expect(Suite.capture(binary + ' --version')).to.be(meta.version);
    });

    it('exits with zero', () => {
      expect(Suite.exitCode(binary + ' --version')).to.be(0);
    });
  });

  describe('--help', () => {
    it('prints the usage information', () => {
      expect(Suite.capture(binary + ' --help'))
        .to.match(new RegExp(meta.description));
    });

    it('prints the help on given no arguments', () => {
      expect(Suite.capture(binary)).to.match(new RegExp(meta.description));
    });

    it('exits with zero', () => {
      expect(Suite.exitCode(binary + ' --help')).to.be(0);
    });
  });

  describe('errors', () => {
    context('destination', () => {
      it('prints permission errors on unpermitted destinations', () => {
        expect(Suite.capture(binary + ` ${validUrl} /root/test.pdf`))
          .to.match(/EACCES: permission denied/)
      });

      it('prints errors when destination is a directory', () => {
        expect(Suite.capture(binary + ` ${validUrl} /root`))
          .to.match(/EISDIR: illegal operation on a directory/)
      });
    });

    context('url', () => {
      it('prints errors on invalid URLs', () => {
        expect(Suite.capture(binary + ` ${invalidUrl} ${pdf}`))
          .to.match(/ERR_CONNECTION_REFUSED|ERR_NAME_NOT_RESOLVED/)
      });
    });
  });

  describe('file generation (defaults)', () => {
    [
      'simple',
      'broken',
      'complex',
      'multipage',
      'websockets'
    ].forEach((flavor) => {
      context(`${flavor} HTML`, () => {
        let url = 'file://' + Suite.fixture(flavor + '.html');
        let pdf = outputDest(flavor);
        let png = Suite.fixture(flavor + '.png');

        before(() => {
          Suite.capture(`${binary} ${url} ${pdf}`);
        });

        it('generates a PDF file', () => {
          expect(existsSync(pdf)).to.be(true);
        });

        it('produces the expected PDF file (1% tolerance)', () => {
          expect(Suite.comparePdfWithPng(pdf, png)).to.be.lessThan(1);
        });
      });
    });
  });

  describe('file generation (templates)', () => {
    context('circles HTML', () => {
      let url = 'file://' + Suite.fixture('templates/circles.html');
      let pdf = outputDest('circles');
      let png = Suite.fixture('templates/circles.png');

      before(() => {
        Suite.capture(`${binary} ${url} ${pdf} \
          --margin-top 2cm \
          --margin-bottom 2cm \
          --header-footer true \
          --landscape true \
          --header-template \
           '${Suite.fixtureContent('templates/circles.header')}' \
          --footer-template \
           '${Suite.fixtureContent('templates/circles.footer')}'`);
      });

      it('generates a PDF file', () => {
        expect(existsSync(pdf)).to.be(true);
      });

      it('produces the expected PDF file (1% tolerance)', () => {
        expect(Suite.comparePdfWithPng(pdf, png)).to.be.lessThan(1);
      });
    });
  });

  describe('file generation (headers)', () => {
    let url = 'http://localhost:3000';
    let pdf = outputDest('headers');
    let png = Suite.fixture('headers.png');

    before((done) => {
      Suite.startTestServer();
      setTimeout(() => {
        Suite.capture(`${binary} \
          --header 'Authorization: Granted!' \
          -a 'X-Test:true' \
          --header 'custom:   header' \
          ${url} ${pdf}`);
        done();
      }, 300);
    });
    after(() => Suite.stopTestServer());

    it('generates a PDF file', () => {
      expect(existsSync(pdf)).to.be(true);
    });

    it('produces the expected PDF file (1% tolerance)', () => {
      expect(Suite.comparePdfWithPng(pdf, png)).to.be.lessThan(1);
    });
  });
});
