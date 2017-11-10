### 1.0.4

* Added a post installation hook to fix the local Chromium file permissions
  (downloaded and installed by puppeteer) This adds file permissions for
  read and execute for group and others. With the new fixup script the
  pdfgen utility should work flawless when installed by root and used
  by a regular user.

### 1.0.3

* Moved the millis dev dependency to non-dev list
  This fix the pdfgen utility usage on production installations.
* Make use of the travis_retry utility to stabilize CI builds

### 1.0.2

* Corrected the pdfgen binary configuration on the package.json
  This should fix the `npm install -g pdfgen` command.

### 1.0.1

* Corrected the license on the package.json

### 1.0.0

* First public release of the pdfgen utility
