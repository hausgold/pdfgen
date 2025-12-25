const Command = require('commander').Command;
const meta = require('../package.json');

/*
 * A set of regex and simple helpers.
 */
const trueFalse = /^(true|false)$/;
const media = /^(print|screen)$/;
const format = /^(Letter|Legal|Tabloid|Ledger|A0|A1|A2|A3|A4|A5)$/;
const unit = /^[0-9.]+(px|in|cm|mm)$/;
const range = /^[0-9]+-?[0-9]*$/;
const integer = /[0-9]+/;
const string = /.+/;
const header = /.+:.+/;
const toTrue = () => true;
const parseBool = (str) => 'true' === str ? true : false;

/**
 * Convert a commandline interface to a usable config object.
 */
class Config {
  /**
   * @constructor
   *
   * @param {string[]} argv The commandline arguments
   */
  constructor(argv) {
    /**
     * All the passed commandline arguments.
     * @type {string[]}
     */
    this.argv = argv;

    /**
     * Holds a number of processing errors.
     * If this array length is zero at the end,
     * then there were no processing errors.
     * @type {Error[]}
     */
    this.errors = [];

    /**
     * The parse configuration hash.
     * @type {object}
     */
    this.hash = {};

    /**
     * The commander instance.
     * @type {object}
     */
    this.parser = this.configureParser(new Command());
  }

  /**
   * A little regex validation helper which performs regex
   * test on a given value and prints out possible values
   * or the whole regex to help the user.
   *
   * @param {string} option The option name
   * @param {RegExp} regex The regex object
   * @returns {Function} Function for commander coercion
   */
  regex(option, regex) {
    return (value) => {
      // Early exit good values
      if (regex.test(value)) {
        return value;
      }

      // Print out possible values or the regex itself
      let r = regex.toString().replace('/^', '').replace(/\$\/i?/gi, '');

      if (/^\(.*\)/i.test(r)) {
        r = r.replace(/^\(|\)$/gi, '').split('|');

        this.errors.push(new Error(
          '--' + option + ' - possible values: ' + r.join(', ')
        ));
        return null;
      }

      this.errors.push(new Error('--' + option + ' - pattern: ' + regex));
      return null;
    };
  }

  /**
   * Collect multiple values for an command line option. You can think of a
   * helper to allow +$ curl -H '...' -H '...'+ while enforcing the given regex
   * per value.
   *
   * @param {string} option The option name
   * @param {RegExp} regex The regex object
   * @returns {Function} Function for commander coercion
   */
  collect(option, regex) {
    let check = this.regex(option, regex);

    return (value, memo) => {
      value = check(value);

      if (value === null) {
        return memo;
      }

      memo.push(value);
      return memo;
    }
  }

  /**
   * A simple helper to sanitize and coerce the collected
   * header array into a header hash.
   *
   * @return {object} The header object
   */
  headers() {
    return this.parser.opts()['header'].reduce((memo, raw) => {
      let parts = raw.split(':');
      memo[parts.shift()] = parts.join(':');
      return memo;
    }, {});
  }

  /**
   * Configure a given Commander instance.
   *
   * @param {object} program A commander instance
   * @returns {object} The given configured commander instance
   */
  configureParser(program) {
    return program
      .description(meta.description)
      .argument('[URL]', 'the URL to print as PDF', 'https://google.com')
      .argument('[DEST]', 'the local destination to save the PDF as', './out.pdf')
      .option('-V, --version', 'Output the version number.', toTrue, false)
      .option('-h, --help', 'Output usage information.', toTrue, false)
      .option('-T, --timeout <integer>',
              'The maximum time to wait for the page to be loaded in ms',
              this.regex('timeout', integer),
              '30000')
      .option('-d, --delay <integer>',
              'Wait for a given time after the page was opened in ms',
              this.regex('delay', integer),
              '1500')
      .option('-t, --network-timeout <integer>',
              'Same as --delay, [deprecated]',
              this.regex('network-timeout', integer),
              '1500')
      .option('-m, --media <string>',
              'Changes the CSS media type of the page.',
              this.regex('media', media))
      .option('-l, --landscape <boolean>',
              'Paper orientation.',
              this.regex('landscape', trueFalse),
              'false')
      .option('-D, --header-footer <boolean>',
              'Display header and footer.',
              this.regex('header-footer', trueFalse),
              'false')
      .option('-b, --background <boolean>',
              'Print background graphics.',
              this.regex('background', trueFalse),
              'true')
      .option('-s, --scale <integer>',
              'Scale of the webpage rendering.',
              this.regex('scale', integer),
              '1')
      .option('-r, --range <string>',
              'Paper ranges to print, e.g., "1-5, 8". ' +
                'Default prints all pages.',
              this.regex('range', range))
      .option('-f, --format <string>',
              'Paper format. If set, takes priority over ' +
                'width or height options.',
              this.regex('format', format),
              'A4')
      .option('-w, --width <string>',
              'Paper width, accepts values labeled with units.',
              this.regex('width', unit))
      .option('-H, --height <string>',
              'Paper height, accepts values labeled with units.',
              this.regex('height', unit))
      .option('-M, --margin <string>',
              'All margins, accepts values labeled with units.',
              this.regex('margin', unit),
              '0')
      .option('-N, --margin-top <string>',
              'Top margin, accepts values labeled with units.',
              this.regex('margin-top', unit))
      .option('-W, --margin-right <string>',
              'Right margin, accepts values labeled with units.',
              this.regex('margin-right', unit))
      .option('-S, --margin-bottom <string>',
              'Bottom margin, accepts values labeled with units.',
              this.regex('margin-bottom', unit))
      .option('-E, --margin-left <string>',
              'Left margin, accepts values labeled with units.',
              this.regex('margin-left', unit))
      .option('-p, --header-template <string>',
              'HTML template for the print header.',
              this.regex('header-template', string))
      .option('-P, --footer-template <string>',
              'HTML template for the print footer.',
              this.regex('footer-template', string))
      .option('-a, --header <string>',
              'Additional HTTP header (eg. "X-Custom: true")',
              this.collect('header', header), [])
      .action((url, dest) => {
        program.url = url;
        program.dest = dest;
      });
  }

  /**
   * Parse the given configuration.
   *
   * @returns {Promise}
   */
  parse() {
    // Utilize Commander for this job
    this.parser.parse(this.argv);
    const rawArgs = this.parser.rawArgs;
    let options = this.parser.opts();

    // When no format was given, but a width/height, we have to remove
    // the default format to respect the settings
    if (!rawArgs.includes('-f') && !rawArgs.includes('--format')) {
      if (rawArgs.includes('-w') || rawArgs.includes('--width')
          || rawArgs.includes('-H') || rawArgs.includes('--height')) {
        delete options.format;
      }
    }

    // Map all the options
    let hash = {
      // Meta Flags
      version: true === options['version'],
      help: true === options['help'],
      args: this.parser.args.length > 0,

      // Global Options
      url: this.parser['url'] || null,
      media: options['media'] || null,
      timeout: parseInt(options['timeout']),
      delay: parseInt(
        options['delay'] || options['networkTimeout']
      ),
      headers: this.headers(),

      // PDF Options
      pdf: {
        path: this.parser['dest'] || null,
        landscape: parseBool(options['landscape']),
        displayHeaderFooter: parseBool(options['headerFooter']),
        printBackground: parseBool(options['background']),
        scale: parseInt(options['scale']) || 1,
        pageRanges: options['range'] || '',
        format: options['format'],
        width: options['width'],
        height: options['height'],
        headerTemplate: options['headerTemplate'],
        footerTemplate: options['footerTemplate'],
        margin: {
          top: options['marginTop'] || options['margin'],
          right: options['marginRight'] || options['margin'],
          bottom: options['marginBottom'] || options['margin'],
          left: options['marginLeft'] || options['margin']
        }
      }
    };

    // Strip off undefined values - the hard way
    // We use JSON here, because it can't represent
    // undefined values and the keys are stripped off.
    this.hash = JSON.parse(JSON.stringify(hash));

    // Return a fancy promise
    return new Promise((resolve, reject) => {
      if (this.errors.length) { return reject(this.errors); }
      resolve(this.hash);
    });
  }

  /**
   * Delivers the help of the commandline interface.
   *
   * @return {Promise} The output promise
   */
  help() {
    return new Promise((resolve) => {
      this.parser.outputHelp(function(output) {

        // Fix the help description
        output = output.replace('output usage information',
                                'Output usage information.');

        // Remove the last help (duplicate)
        output = output
          .split("\n")
          .reduce((memo, line) => {
            if (!memo.includes(line) || '' === line.trim()) {
              memo.push(line);
            }
            return memo;
          }, [])
          .join("\n");

        // Add some appendix information
        output = output.replace(/$/, [
          '',
          '  Additional information:',
          '',
          '    All possible units are:',
          '',
          '      px - pixel           in - inch',
          '      cm - centimeter      mm - millimeter',
          '',
          '    The format options are:',
          '',
          '      Letter: 8.5in x 11in    Legal: 8.5in x 14in',
          '      Tabloid: 11in x 17in    Ledger: 17in x 11in',
          '      A0: 33.1in x 46.8in     A1: 23.4in x 33.1in',
          '      A2: 16.5in x 23.4in     A3: 11.7in x 16.5in',
          '      A4: 8.27in x 11.7in     A5: 5.83in x 8.27in',
          '',
          '    Available template injection classes:',
          '',
          '      date: formatted print date',
          '      title: document title',
          '      url: document location',
          '      pageNumber: current page number',
          '      totalPages: total pages in the document',
        ].join('\n'));

        // Add some examples
        output = output.replace(/$/, [
          '', '',
          '  Examples:',
          '',
          '    All defaults:',
          '',
          '      pdfgen https://google.com defaults.pdf',
          '',
          '    Landscape output:',
          '',
          '      pdfgen -l true https://bit.ly/45k8tEU landscape.pdf',
          '',
          '    Print variant:',
          '',
          '      pdfgen -M 2cm -m print -b false' +
            ' https://bit.ly/459te7q print.pdf',
        ].join('\n'));

        // Call the given callback
        resolve(output);

        // Play ticks on Commander
        return '';
      });
    });
  }
};

module.exports = Config;
