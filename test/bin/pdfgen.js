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
  let validDest = '/tmp/test.pdf';
  let cleanup = () => {
    if (existsSync(validDest)) { unlinkSync(validDest); }
  };

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
        expect(Suite.capture(binary + ` ${invalidUrl} ${validDest}`))
          .to.match(/Failed to navigate:/)
      });
    });
  });

  describe('file generation', () => {
    [
      'simple',
      'broken',
      'complex',
      'multipage'
    ].forEach((flavor) => {
      context(`${flavor} HTML`, () => {
        let url = 'file://' + Suite.fixture(flavor + '.html');
        let png = Suite.fixture(flavor + '.png');

        beforeEach(() => {
          Suite.capture(binary + ` ${url} ${validDest}`);
        });

        it('generates a PDF file', () => {
          expect(existsSync(validDest)).to.be(true);
        });

        it('produces the expected PDF file (1% tolerance)', () => {
          expect(Suite.comparePdfWithPng(validDest, png)).to.be.lessThan(1);
        });
      });
    });
  });
});
