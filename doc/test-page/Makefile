MAKEFLAGS += --warn-undefined-variables -j1
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.PHONY:

# Directories
DIST_DIR ?= dist
VENDOR_DIR ?= node_modules

# Host binaries
ECHO ?= echo
EXIT ?= exit
FIND ?= find
MKDIR ?= mkdir
NODE ?= node
NPM ?= npm
PDFGEN ?= ../../bin/pdfgen
RENDER ?= $(NODE) bin/render.js
RM ?= rm
SASS ?= $(VENDOR_DIR)/.bin/sass
TEST ?= test
UGLIFYJS ?= $(VENDOR_DIR)/.bin/uglifyjs

clean:
	# Clean the generated test page
	@$(RM) -rf $(DIST_DIR)

distclean: clean
	# Clean vendor files
	@$(RM) -rf $(VENDOR_DIR) package-lock.json

install:
	# Install all dependencies
	@$(TEST) -d $(VENDOR_DIR) || $(NPM) install

build: clean install
	# Generate the test page
	@$(MKDIR) -p $(DIST_DIR)
	# > Compile sass to a minified css file (bundles normalize.css)
	@$(SASS) --no-source-map --style=compressed --load-path=$(VENDOR_DIR) \
		src/index.scss $(DIST_DIR)/index.css
	# > Minify js files
	@$(UGLIFYJS) -o $(DIST_DIR)/index.js src/index.js
	# > Render pug to a html file (inlines the css and js files)
	@$(RENDER) src/index.pug $(DIST_DIR)/index.html
	# > Cleanup unneeded assets
	@$(FIND) $(DIST_DIR) -type f -not -name "*.html" -exec $(RM) -f {} \;
	# > Generate the PDF file
	@$(PDFGEN) 'file://$(abspath dist/index.html)' $(DIST_DIR)/test-page.pdf

check: build
	# Check the generated test page
	@$(TEST) -f $(DIST_DIR)/index.html \
		|| ($(ECHO) '# Generated test page was not found (html).'; $(EXIT) 1)
	# Generated test page ($(DIST_DIR)/index.html) was found. Yay.
	@$(TEST) -f $(DIST_DIR)/test-page.pdf \
		|| ($(ECHO) '# Generated test page was not found (pdf).'; $(EXIT) 1)
	# Generated test page ($(DIST_DIR)/test-page.pdf) was found. Yay.

all: check
