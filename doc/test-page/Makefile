MAKEFLAGS += --warn-undefined-variables -j1
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.PHONY:

VENDOR_DIR := node_modules
DIST_DIR ?= dist

NODE ?= node
NPM ?= npm
FIND ?= find
MKDIR ?= mkdir
TEST ?= test
CLEANCSS ?= $(VENDOR_DIR)/.bin/cleancss
INLINE ?= $(NODE) bin/inline.js
PUG ?= $(VENDOR_DIR)/.bin/pug
SASS ?= $(VENDOR_DIR)/.bin/node-sass
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
	# > Compile pug to html files
	@$(PUG) -s -o $(DIST_DIR) src/index.pug
	# > Compile sass to css files
	@$(SASS) -q -o $(DIST_DIR) src/index.scss
	# > Minify js files
	@$(UGLIFYJS) -o $(DIST_DIR)/index.js src/index.js
	# > Minify css fíles
	@$(CLEANCSS) -o $(DIST_DIR)/normalize.css \
		$(VENDOR_DIR)/normalize.css/normalize.css
	@$(CLEANCSS) -o $(DIST_DIR)/index.css $(DIST_DIR)/index.css
	# > Inline all assets
	@$(INLINE) $(DIST_DIR)/index.html
	# > Cleanup unneeded assets
	@$(FIND) $(DIST_DIR) -type f -not -name "*.html" -exec $(RM) -f {} \;

check: build
	# Check the generated test page
	@$(TEST) -f $(DIST_DIR)/index.html \
		|| (echo '# Generated test page was not found.'; exit 1)
	# Generated test page ($(DIST_DIR)/index.html) was found. Yay.

all: check
