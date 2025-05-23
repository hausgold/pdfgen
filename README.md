![pdfgen](https://raw.githubusercontent.com/hausgold/pdfgen/master/doc/assets/project.svg)

[![Continuous Integration](https://github.com/hausgold/pdfgen/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/hausgold/pdfgen/actions/workflows/test.yml)
[![npm Version](https://img.shields.io/npm/v/pdfgen.svg)](https://www.npmjs.com/package/pdfgen)
[![Test Coverage](https://automate-api.hausgold.de/v1/coverage_reports/pdfgen/coverage.svg)](https://knowledge.hausgold.de/coverage)
[![Test Ratio](https://automate-api.hausgold.de/v1/coverage_reports/pdfgen/ratio.svg)](https://knowledge.hausgold.de/coverage)
[![API docs](https://automate-api.hausgold.de/v1/coverage_reports/pdfgen/documentation.svg)](https://www.npmjs.com/package/pdfgen)

This tool is dedicated to the generation of a PDF file from a given URL in a
highly customizable manner. It makes use of the [Google Puppeteer
API](https://github.com/puppeteer/puppeteer) to utilize Chromium to fulfill
the task. It also ships some website examples which provide tips on how to
design the pages to be printable.

- [Why another PDF generation tool?](#why-another-pdf-generation-tool)
- [Requirements](#requirements)
- [Getting started](#getting-started)
  - [Commandline options](#commandline-options)
  - [Units options](#units-options)
  - [Format options](#format-options)
  - [Template injection classes](#template-injection-classes)
- [Example Website](#example-website)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Code of Conduct](#code-of-conduct)
- [Releasing](#releasing)

## Why another PDF generation tool?

If you are into typesetting/[LaTeX](https://www.latex-project.org/) or tools
like [wkhtmltopdf](https://wkhtmltopdf.org/) you know they can be hard to
manage by web devs or are not intented to be simple at usage. This is
especially worse when it comes to dynamic content like user customizable info
papers. pdfgen allows you to easily make use of the latest web technologies
which are supported by
[Chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md).
(including CSS3 flexbox, custom webfonts, etc)

## Requirements

* [Node.js](https://nodejs.org) (>=20)
* [GNU Make (development)](https://www.gnu.org/software/make/) (>=4.2.1)

## Getting started

The first and only preparation step is the installation of the pdfgen utility.
Open up your favorite terminal emulator and paste the following command:

```bash
# Install the pdfgen utility
$ npm install -g pdfgen
```

NPM will take care of the installation of the dependencies, including the
Puppeteer API plus the Chromium build for your machine. All you need to do now
is to use it like this:

```bash
# Generate a PDF from a URL
$ pdfgen 'http://google.com' google.pdf
```

### Commandline options

As the getting started section demonstrated, the usage of the pdfgen utility is
straightforward. It just requires two arguments, the URL and the destination of
the resulting PDF file. But thats not all. You can customize the resulting PDF
as well as the website which is visited. Here comes a complete list of
supported commandline options:

Option | Description
-------|------------
**-T, --timeout**         | The maximum time to wait for the page to be loaded in ms. **30000**
**-d, --delay**           | Wait for a given time after the page was opened in ms. **1000**
**-t, --network-timeout** | Same as --delay, [deprecated] **1000**
**-m, --media**           | Changes the CSS media type of the page. (page, print)
**-l, --landscape**       | Paper orientation. (**false**, true)
**-h, --header-footer**   | Display header and footer. (**false**, true)
**-b, --background**      | Print background graphics. (false, **true**)
**-s, --scale**           | Scale of the webpage rendering. (**1**)
**-r, --range**           | Paper ranges to print, e.g., "1-5, 8". (**prints all pages**)
**-f, --format**          | Paper format. If set, takes priority over width or height options. (**A4**)
**-w, --width**           | Paper width, accepts values labeled with units.
**-H, --height**          | Paper height, accepts values labeled with units.
**-M, --margin**          | All margins, accepts values labeled with units. (**0**)
**-N, --margin-top**      | Top margin, accepts values labeled with units.
**-W, --margin-right**    | Right margin, accepts values labeled with units.
**-S, --margin-bottom**   | Bottom margin, accepts values labeled with units.
**-E, --margin-left**     | Left margin, accepts values labeled with units.
**-p, --header-template** | HTML template for the print header.
**-P, --footer-template** | HTML template for the print footer.
**-a, --header**          | Additional HTTP header (eg. `X-Custom: true`)

### Units options

* px - pixel
* cm - centimeter
* in - inch
* mm - millimeter

### Format options

* Letter: 8.5in x 11in
* Tabloid: 11in x 17in
* A0: 33.1in x 46.8in
* A2: 16.5in x 23.4in
* A4: 8.27in x 11.7in
* Legal: 8.5in x 14in
* Ledger: 17in x 11in
* A1: 23.4in x 33.1in
* A3: 11.7in x 16.5in
* A5: 5.83in x 8.27in

### Template injection classes

* date: formatted print date
* title: document title
* url: document location
* pageNumber: current page number
* totalPages: total pages in the document

## Example Website

This repository contains [a full test page project](./doc/test-page/) which
demonstrate the simple usage of the pdfgen utility on a custom website. It
makes use of the [pug template engine](https://pugjs.org),
[SASS](http://sass-lang.com/), and vanilla JavaScript. Just have a look at the
few simple lines of code and play around with it or just view [the resulting
PDF file](./doc/test-page/dist/test-page.pdf) if your are curious.

There are some caveats you should know about: The PDF generation (print media)
does not work very well with the responsive approach. You can of course
implement your custom website this way and provide a different stylesheet for
the print media type, but this won't save you from the content-per-page issue
in case you care about fixed headers/footers. The last page at the [example
website](./doc/test-page/dist/test-page.pdf) will demonstrate this issue.

The general advise here is to use a custom page class which works like a
content container with a fixed height and width (make use of the `100vh/100vw`
values for height and width to be "responsive" on the resulting media). With
this approach you *just* need to how much content will be on a single page. (If
you are in LaTeX, you will know about this concept already)

So in the end you take care of long dynamic texts with some functions on your
template engine and cut it into fitting pieces for each page. You could
implement a function which cuts the text after n characters while respecting
word boundaries. Then the resulting set of chunks represent a single page by
each.

These are the worst things to know. But here comes the good news: you can make
use of any modern web technology, including CSS3 (flexbox, counters etc) and
custom web fonts just like that.

## Development

After checking out the repo, run `make install` to install dependencies. Then,
run `make test` to run the tests.

To release a new version, update the version number in
[package.json](./package.json), commit this change, and finally create a git
tag for the version. The release to [npmjs.com](https://www.npmjs.com/) must be
done manually at the moment.

## Contributing

Bug reports and pull requests are welcome on GitHub at
https://github.com/hausgold/pdfgen. This project is intended to be a safe,
welcoming space for collaboration, and contributors are expected to adhere to
the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The pdfgen utility is available as open source under the terms of the [MIT
License](http://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the pdfgen project’s codebases, issue trackers, chat
rooms and mailing lists is expected to follow the [code of
conduct](./CODE_OF_CONDUCT.md).

## Releasing

The release process of this Gem is fully automated. You just need to open the
Github Actions [Release
Workflow](https://github.com/hausgold/alarmable/actions/workflows/release.yml)
and trigger a new run via the **Run workflow** button. Insert the new version
number (check the [changelog](./CHANGELOG.md) first for the latest release) and
you're done.
