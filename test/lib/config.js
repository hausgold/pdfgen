const Config = require(Suite.root('lib/config'));
const argv = ['node', 'pdfgen'];

// Parse the given commandline arguments and hand back the config hash
const parse = (...args) => new Config([...argv, ...args]).parse();

// Fetch a nested value of the config hash by its dotted path
const dig = (hash, path) => {
  return path.split('.').reduce((memo, key) => memo[key], hash);
};

describe('Config', function() {
  describe('#parse', () => {
    beforeEach(() => {
      this.processExitCalled = false;
      this.originalProcessExit = process.exit;
      this.originalConsoleError = console.error;
      process.exit = () => { this.processExitCalled = true; };
      console.error = () => { };
    });
    afterEach(() => {
      process.exit = this.originalProcessExit;
      console.error = this.originalConsoleError;
    });

    context('<URL> argument', () => {
      it('requires only the <URL> argument', async () => {
        const config = new Config([...argv, 'url']);
        await config.parse();
        expect(this.processExitCalled).to.be(false);
      });

      it('does not die without arguments', async () => {
        const config = new Config([...argv]);
        await config.parse();
        expect(this.processExitCalled).to.be(false);
      });

      it('sets the correct value on the config hash', async () => {
        const config = new Config([...argv, 'url', 'dest']);
        await config.parse();
        expect(config.hash.url).to.be('url');
      });
    });

    context('<DEST> argument', () => {
      it('sets the correct value on the config hash', async () => {
        const config = new Config([...argv, 'url', 'dest']);
        await config.parse();
        expect(config.hash.pdf.path).to.be('dest');
      });
    });

    [
      // option          , valid      , expected   , config path
      ['timeout'         , '30000'    , 30000      , 'timeout']                ,
      ['network-timeout' , '1500'     , 1500       , 'delay']                  ,
      ['delay'           , '1500'     , 1500       , 'delay']                  ,
      ['media'           , 'print'    , 'print'    , 'media']                  ,
      ['header'          , 'a:b'      , {a: 'b'}   , 'headers']                ,
      ['landscape'       , 'true'     , true       , 'pdf.landscape']          ,
      ['header-footer'   , 'false'    , false      , 'pdf.displayHeaderFooter'],
      ['background'      , 'true'     , true       , 'pdf.printBackground']    ,
      ['scale'           , '99'       , 99         , 'pdf.scale']              ,
      ['range'           , '5-9'      , '5-9'      , 'pdf.pageRanges']         ,
      ['format'          , 'A2'       , 'A2'       , 'pdf.format']             ,
      ['width'           , '100px'    , '100px'    , 'pdf.width']              ,
      ['height'          , '1cm'      , '1cm'      , 'pdf.height']             ,
      ['margin-top'      , '4in'      , '4in'      , 'pdf.margin.top']         ,
      ['margin-right'    , '99mm'     , '99mm'     , 'pdf.margin.right']       ,
      ['margin-bottom'   , '2.52cm'   , '2.52cm'   , 'pdf.margin.bottom']      ,
      ['margin-left'     , '22.222in' , '22.222in' , 'pdf.margin.left']        ,
      ['header-template' , '"Test"'   , '"Test"'   , 'pdf.headerTemplate']     ,
      ['footer-template' , '"Test"'   , '"Test"'   , 'pdf.footerTemplate']     ,
    ].forEach((opts) => {
      let option = opts[0];
      let valid = opts[1];
      let expected = opts[2];
      let path = opts[3];

      context('--' + opts[0] + ' option', () => {
        it('produce a error on invalid inputs for ' + option, async () => {
          const config = new Config([...argv, '--' + option, 'wrongWrong']);
          return config.parse().catch((err) => {
            expect(err).not.to.be.empty();
          });
        });

        it('the error message contains the option name', async () => {
          const config = new Config([...argv, '--' + option, 'wrongWrong']);
          return config.parse().catch((err) => {
            expect(err.shift().message).to.match(new RegExp('--' + option));
          });
        });

        it('sets the correct value on the config hash', async () => {
          const config = new Config([...argv, '--' +  option, valid]);
          await config.parse();
          let check = (typeof expected == 'object') ? 'eql' : 'be';
          expect(eval('config.hash.' + path)).to[check](expected);
        });
      });
    });

    context('without any arguments', () => {
      [
        // config path              , expected
        ['version'                  , false]                ,
        ['help'                     , false]                ,
        ['args'                     , false]                ,
        ['url'                      , 'https://google.com'] ,
        ['media'                    , null]                 ,
        ['timeout'                  , 30000]                ,
        ['delay'                    , 1500]                 ,
        ['headers'                  , {}]                   ,
        ['pdf.path'                 , './out.pdf']          ,
        ['pdf.landscape'            , false]                ,
        ['pdf.displayHeaderFooter'  , false]                ,
        ['pdf.printBackground'      , true]                 ,
        ['pdf.scale'                , 1]                    ,
        ['pdf.pageRanges'           , '']                   ,
        ['pdf.format'               , 'A4']                 ,
        ['pdf.width'                , undefined]            ,
        ['pdf.height'               , undefined]            ,
        ['pdf.headerTemplate'       , undefined]            ,
        ['pdf.footerTemplate'       , undefined]            ,
        ['pdf.margin.top'           , '0']                  ,
        ['pdf.margin.right'         , '0']                  ,
        ['pdf.margin.bottom'        , '0']                  ,
        ['pdf.margin.left'          , '0']                  ,
      ].forEach(([path, expected]) => {
        it(`defaults ${path} to ${JSON.stringify(expected)}`, async () => {
          expect(dig(await parse(), path)).to.eql(expected);
        });
      });
    });

    context('meta flags', () => {
      [
        // flag      , config path
        ['--version' , 'version'] ,
        ['-V'        , 'version'] ,
        ['--help'    , 'help']    ,
        ['-h'        , 'help']    ,
      ].forEach(([flag, path]) => {
        it(`sets ${path} on the config hash for ${flag}`, async () => {
          expect(dig(await parse(flag), path)).to.be(true);
        });
      });

      it('signals given arguments', async () => {
        expect((await parse('url')).args).to.be(true);
      });

      it('does not die on --version', async () => {
        await parse('--version');
        expect(this.processExitCalled).to.be(false);
      });

      it('does not die on --help', async () => {
        await parse('--help');
        expect(this.processExitCalled).to.be(false);
      });
    });

    context('short options', () => {
      [
        // flag , value     , expected  , config path
        ['-T'   , '100'     , 100       , 'timeout']                 ,
        ['-d'   , '100'     , 100       , 'delay']                   ,
        ['-m'   , 'screen'  , 'screen'  , 'media']                   ,
        ['-a'   , 'a:b'     , {a: 'b'}  , 'headers']                 ,
        ['-l'   , 'true'    , true      , 'pdf.landscape']           ,
        ['-D'   , 'true'    , true      , 'pdf.displayHeaderFooter'] ,
        ['-b'   , 'false'   , false     , 'pdf.printBackground']     ,
        ['-s'   , '2'       , 2         , 'pdf.scale']               ,
        ['-r'   , '1-2'     , '1-2'     , 'pdf.pageRanges']          ,
        ['-f'   , 'A5'      , 'A5'      , 'pdf.format']              ,
        ['-w'   , '10cm'    , '10cm'    , 'pdf.width']               ,
        ['-H'   , '20cm'    , '20cm'    , 'pdf.height']              ,
        ['-M'   , '1cm'     , '1cm'     , 'pdf.margin.top']          ,
        ['-N'   , '1cm'     , '1cm'     , 'pdf.margin.top']          ,
        ['-W'   , '1cm'     , '1cm'     , 'pdf.margin.right']        ,
        ['-S'   , '1cm'     , '1cm'     , 'pdf.margin.bottom']       ,
        ['-E'   , '1cm'     , '1cm'     , 'pdf.margin.left']         ,
        ['-p'   , '<b></b>' , '<b></b>' , 'pdf.headerTemplate']      ,
        ['-P'   , '<b></b>' , '<b></b>' , 'pdf.footerTemplate']      ,
      ].forEach(([flag, value, expected, path]) => {
        it(`sets ${path} on the config hash for ${flag}`, async () => {
          expect(dig(await parse(flag, value), path)).to.eql(expected);
        });
      });
    });

    context('paper format and dimensions', () => {
      [
        ['--width', '10cm'],
        ['-w', '10cm'],
        ['--height', '20cm'],
        ['-H', '20cm'],
      ].forEach((args) => {
        it(`drops the default format for ${args.join(' ')}`, async () => {
          expect((await parse(...args)).pdf).not.to.have.key('format');
        });
      });

      [
        ['--format', 'A3', '--width', '10cm'],
        ['-f', 'A3', '-H', '20cm'],
      ].forEach((args) => {
        it(`keeps the given format for ${args.join(' ')}`, async () => {
          expect((await parse(...args)).pdf.format).to.be('A3');
        });
      });

      it('keeps the dimensions next to a given format', async () => {
        const hash = await parse('--format', 'A3', '--width', '10cm');
        expect(hash.pdf.width).to.be('10cm');
      });
    });

    context('margins', () => {
      it('applies --margin to all sides', async () => {
        expect((await parse('--margin', '1cm')).pdf.margin).to.eql({
          top: '1cm', right: '1cm', bottom: '1cm', left: '1cm'
        });
      });

      it('prefers the side specific margins over --margin', async () => {
        const hash = await parse(
          '--margin', '1cm', '--margin-top', '2cm', '--margin-left', '3mm'
        );
        expect(hash.pdf.margin).to.eql({
          top: '2cm', right: '1cm', bottom: '1cm', left: '3mm'
        });
      });
    });

    context('headers', () => {
      it('collects multiple headers', async () => {
        const hash = await parse('--header', 'a:b', '-a', 'c:d');
        expect(hash.headers).to.eql({a: 'b', c: 'd'});
      });

      it('keeps colons within the header value', async () => {
        const hash = await parse('--header', 'Referer:http://localhost:80');
        expect(hash.headers).to.eql({Referer: 'http://localhost:80'});
      });

      it('rejects with all errors on multiple invalid headers', async () => {
        const errors = await parse('-a', 'wrong', '-a', 'more-wrong')
          .catch((err) => err);
        expect(errors).to.have.length(2);
      });
    });

    context('multiple invalid options', () => {
      it('rejects with one error per invalid option', async () => {
        const errors = await parse('--media', 'wrong', '--format', 'wrong')
          .catch((err) => err);
        expect(errors).to.have.length(2);
      });

      it('lists the possible values of an invalid option', async () => {
        const errors = await parse('--media', 'wrong').catch((err) => err);
        expect(errors.shift().message)
          .to.be('--media - possible values: print, screen');
      });
    });
  });

  describe('#help', () => {
    let help;

    before(async () => { help = await new Config([...argv]).help(); });

    it('gives back a promise with the usage information', async () => {
      const config = new Config([...argv]);
      expect(await config.help()).not.to.be.empty();
    });

    it('includes the usage line', () => {
      expect(help).to.match(/Usage: .*\[options\] \[URL\] \[DEST\]/);
    });

    it('includes the description', () => {
      expect(help).to.contain('Generate a PDF from a given URL');
    });

    it('lists the arguments', () => {
      expect(help).to.match(/URL +the URL to print as PDF/);
    });

    it('lists the options', () => {
      expect(help).to.contain('-a, --header <string>');
    });

    it('lists the default values of the options', () => {
      expect(help).to.match(/--format <string>[^-]+\(default: "A4"\)/);
    });

    it('lists the help option just once', () => {
      expect(help.match(/-h, --help/g)).to.have.length(1);
    });

    it('includes the units', () => {
      expect(help).to.contain('All possible units are:');
    });

    it('includes the paper formats', () => {
      expect(help).to.contain('The format options are:');
    });

    it('includes the template injection classes', () => {
      expect(help).to.contain('Available template injection classes:');
    });

    it('includes the examples', () => {
      expect(help).to.contain('pdfgen https://google.com defaults.pdf');
    });
  });
});
