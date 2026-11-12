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

      it('exits with one on invalid URLs', () => {
        expect(Suite.exitCode(binary + ` ${invalidUrl} ${pdf}`)).to.be(1);
      });

      it('generates no PDF file on invalid URLs', () => {
        Suite.capture(binary + ` ${invalidUrl} ${pdf}`);
        expect(existsSync(pdf)).to.be(false);
      });
    });

    context('options', () => {
      let invalid = `${binary} --media wrong ${validUrl} ${pdf}`;
      let unknown = `${binary} --unknown ${validUrl} ${pdf}`;
      let excess = `${binary} ${validUrl} ${pdf} excess`;

      it('prints the possible values on invalid option values', () => {
        expect(Suite.capture(invalid))
          .to.match(/--media - possible values: print, screen/);
      });

      it('exits with one on invalid option values', () => {
        expect(Suite.exitCode(invalid)).to.be(1);
      });

      it('prints errors on unknown options', () => {
        expect(Suite.capture(unknown)).to.match(/unknown option '--unknown'/);
      });

      it('exits with one on unknown options', () => {
        expect(Suite.exitCode(unknown)).to.be(1);
      });

      it('prints errors on too many arguments', () => {
        expect(Suite.capture(excess)).to.match(/too many arguments/);
      });

      it('exits with one on too many arguments', () => {
        expect(Suite.exitCode(excess)).to.be(1);
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

        it('produces the expected PDF file (5% tolerance)', () => {
          Suite.expectPdfToMatchPng(pdf, png, 5);
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

      it('produces the expected PDF file (5% tolerance)', () => {
        Suite.expectPdfToMatchPng(pdf, png, 5);
      });
    });
  });

  describe('file generation (paper)', () => {
    // The tolerance of the page sizes in points, because Chromium snaps
    // the paper dimensions to its own units
    let tolerance = 3;

    [
      // flavor     , options                      , width , height
      ['default'    , ''                           , 595   , 842]   ,
      ['format'     , '--format A5'                , 420   , 595]   ,
      ['landscape'  , '--landscape true'           , 842   , 595]   ,
      ['dimensions' , '--width 10cm --height 20cm' , 283   , 567]   ,
      ['width'      , '--width 10cm'               , 283   , 792]   ,
    ].forEach(([flavor, options, width, height]) => {
      context(`${flavor} paper (${options || 'no options'})`, () => {
        let url = 'file://' + Suite.fixture('simple.html');
        let pdf = outputDest(`paper-${flavor}`);

        before(() => {
          Suite.capture(`${binary} --delay 0 ${options} ${url} ${pdf}`);
        });

        it(`produces a page width of about ${width}pt`, () => {
          expect(Suite.pdfPages(pdf).shift().width)
            .to.be.within(width - tolerance, width + tolerance);
        });

        it(`produces a page height of about ${height}pt`, () => {
          expect(Suite.pdfPages(pdf).shift().height)
            .to.be.within(height - tolerance, height + tolerance);
        });
      });
    });

    [
      // flavor     , options       , pages
      ['all pages'  , ''            , 2] ,
      ['first page' , '--range 1'   , 1] ,
      ['page range' , '--range 1-2' , 2] ,
    ].forEach(([flavor, options, pages]) => {
      context(`${flavor} (${options || 'no options'})`, () => {
        let url = 'file://' + Suite.fixture('multipage.html');
        let pdf = outputDest(`paper-${flavor.replace(' ', '-')}`);

        before(() => {
          Suite.capture(`${binary} --delay 0 ${options} ${url} ${pdf}`);
        });

        it(`produces ${pages} page(s)`, () => {
          expect(Suite.pdfPages(pdf)).to.have.length(pages);
        });
      });
    });
  });

  describe('file generation (headers)', () => {
    let url = 'http://localhost:3823';
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

    it('produces the expected PDF file (5% tolerance)', () => {
      Suite.expectPdfToMatchPng(pdf, png, 5);
    });
  });
});
