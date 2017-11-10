MAKEFLAGS += --warn-undefined-variables -j1
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.PHONY:

COVERAGE_DIR ?= coverage
DOC_DIR ?= doc/api
TMP_DIR ?= test/tmp
VENDOR_DIR ?= node_modules

CONVERT ?= convert
JSDOC ?= $(VENDOR_DIR)/.bin/jsdoc
MKDIR ?= mkdir
NODE ?= node
NPM ?= npm
PDFGEN ?= bin/pdfgen
RM ?= rm

HTML_TEST_FILES := $(wildcard test/fixtures/*.html)

all:
	# PDF Generator (pdfgen)
	#
	# install          Install all dependencies
	#
	# docs             Generate the application documentation
	#
	# clean            Clean all runtime data
	# distclean        Same as clean and cleans dependencies
	#
	# test             Run the whole test suite
	# test-specs       Check the application specifications

clean: clean-test-results
	# Clean all runtime data
	@$(RM) -rf $(DOC_DIR)

clean-test-results:
	# Clean test results
	@$(RM) -rf $(TMP_DIR) $(COVERAGE_DIR)

distclean: clean
	# Same as clean and cleans dependencies
	@$(RM) -rf $(VENDOR_DIR)

install:
	# Install all dependencies
	@$(NPM) install

docs: clean
	# Generate the application documentation
	@$(MKDIR) -p $(DOC_DIR)
	@$(JSDOC) -d $(DOC_DIR) -r lib bin

test-specs: clean-test-results
	# Check the application specifications
	@$(MKDIR) -p $(TMP_DIR) $(COVERAGE_DIR)
	@$(NPM) run test
	@$(NPM) run coverage

test: test-specs

update-pdf-images:
	# Update the expected PDF images fixtures
	@$(foreach HTML_FILE,$(HTML_TEST_FILES),\
		echo "# > Convert $(HTML_FILE) to a png image"; \
		$(RM) -f $(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE)); \
		$(PDFGEN) \
			file://$(shell pwd)/$(HTML_FILE) \
			$(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE)); \
		$(CONVERT) -density 150 -trim \
			$(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE)) \
			-quality 100 +append \
			$(shell pwd)/$(patsubst %.html,%.png,$(HTML_FILE)); \
		$(RM) -f $(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE));)
