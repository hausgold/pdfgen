const Config = require(Suite.root('lib/config'));
const argv = ['node', 'pdfgen'];

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
      it('requires both <URL> and <DEST>', async () => {
        const config = new Config([...argv, 'url', 'dest']);
        await config.parse();
        expect(this.processExitCalled).to.be(false);
      });

      it('dies on only <URL>', async () => {
        const config = new Config([...argv, 'url']);
        await config.parse();
        expect(this.processExitCalled).to.be(true);
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
          expect(eval('config.hash.' + path)).to.be(expected);
        });
      });
    });
  });

  describe('#help', () => {
    it('gives back a promise with the usage information', async () => {
      const config = new Config([...argv]);
      expect(await config.help()).not.to.be.empty();
    });
  });
});
