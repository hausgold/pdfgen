### next

* TODO: Replace this bullet point with an actual description of a change.

### 1.5.4 (21 May 2025)

* Just a retag of 1.5.3

### 1.5.3 (17 April 2025)

* Just a retag of 1.5.2

### 1.5.2 (17 April 2025)

* Upgraded from Node.js 16-18 to 20 and 22 (20 is the new minimum)

### 1.5.1 (30 December 2022)

* When no format is given, but a height/width the format A4 is nonetheless
  given to Puppeteer - corrected this faulty behaviour

### 1.5.0 (21 October 2022)

* Upgraded to puppeteer 19.0.0 (10.1.0 previous)
* Upgraded from Node.js 14-16 to 16 and 18 (16 is the new minimum)

### 1.4.1 (21 October 2022)

* No code updates, just updated the readme/docs

### 1.4.0 (21 October 2022)

* Upgraded to puppeteer 10.1.0 (1.14.0 previous)
* Upgraded from Node.js 8-11 to 14 and 16 (14 is the new minimum)

### 1.3.0 (10 April 2019)

* Upgraded to puppeteer 1.14.0 (1.1.0 previous)
* Added the --header option to set additional headers for the main request

### 1.2.0 (20 February 2018)

* Upgraded to puppeteer 1.1.0 (1.0.0 previous)

### 1.1.0 (19 February 2018)

* Upgraded to puppeteer 1.0.0 (0.10.2 previous)
* Added support for the header and footer templates
* The new navigation wait mechanism was used (load, domcontentloaded,
  networkidle2)
* The --network-timeout option was deprecated in favor of --delay
* A new --timeout specifies now the overall navigation timeout (page load)
* The media type now defaults to nothing, to overcome some Chromium gliches
  (pdf's look like the 1.0 ones)
* A new general --margin was added, all specific directions falls back to
  this value
* All commandline options now have a short version (-h)
* The error handling was improved, we do not print usage hints on
  errors anymore

### 1.0.4 (10 November 2017)

* Added a post installation hook to fix the local Chromium file permissions
  (downloaded and installed by puppeteer) This adds file permissions for
  read and execute for group and others. With the new fixup script the
  pdfgen utility should work flawless when installed by root and used
  by a regular user.

### 1.0.3 (10 November 2017)

* Moved the millis dev dependency to non-dev list
  This fix the pdfgen utility usage on production installations.
* Make use of the travis_retry utility to stabilize CI builds

### 1.0.2 (10 November 2017)

* Corrected the pdfgen binary configuration on the package.json
  This should fix the `npm install -g pdfgen` command.

### 1.0.1 (9 November 2017)

* Corrected the license on the package.json

### 1.0.0 (9 November 2017)

* First public release of the pdfgen utility
