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
BASH ?= bash
COMPOSE ?= docker-compose
NPM ?= npm
PDFGEN ?= bin/pdfgen
RM ?= rm

HTML_FILES := $(wildcard test/fixtures/*.html)
PDF_FILES := $(shell find test/fixtures/ -name '*.html' \
	| sed 's/html$$/pdf/g')

all:
	# PDF Generator (pdfgen)
	#
	# install          Install all dependencies
	#
	# docs             Generate the application documentation
	# shell            Start an interactive shell session
	#
	# clean            Clean all runtime data
	# distclean        Same as clean and cleans dependencies
	#
	# test             Run the whole test suite
	# test-specs       Check the application specifications
	# fixtures         Regenerate all fixtures (pdf and png files)

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

shell:
	# Start an interactive shell session
	@$(COMPOSE) run \
		-e LANG=en_US.UTF-8 -e LANGUAGE=en_US.UTF-8 -e LC_ALL=en_US.UTF-8 \
		-u node shell $(BASH) -c 'sleep 0.1; echo; $(BASH) -i'

pdf: \
	pdf-defaults \
	pdf-templates

pdf-defaults:
	# Generate all PDF files with default settings
	@$(foreach HTML_FILE,$(HTML_FILES),\
		echo "# > Convert $(HTML_FILE) to PDF file"; \
		$(RM) -f $(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE)); \
		$(PDFGEN) \
			file://$(shell pwd)/$(HTML_FILE) \
			$(shell pwd)/$(patsubst %.html,%.pdf,$(HTML_FILE));)

pdf-templates:
	# Generate all PDF files with header/footer templates
	# > Convert test/fixtures/templates/header_footer.html to PDF file
	@$(PDFGEN) \
		file://$(abspath test/fixtures/templates/circles.html) \
		$(abspath test/fixtures/templates/circles.pdf) \
		--margin-top 2cm \
		--margin-bottom 2cm \
		--header-footer true \
		--landscape true \
		--header-template \
			'$(shell cat test/fixtures/templates/circles.header)' \
		--footer-template \
			'$(shell cat test/fixtures/templates/circles.footer)'

png:
	# Generate PNG files from all PDF files
	@$(foreach PDF_FILE,$(PDF_FILES),\
		echo "# > Convert $(PDF_FILE) to PNG file"; \
		$(CONVERT) \
			-define profile:skip=ICC \
			-density 150 \
			$(shell pwd)/$(PDF_FILE) \
			-quality 100 +append \
			$(shell pwd)/$(patsubst %.pdf,%.png,$(PDF_FILE));)

fixtures: pdf png
update-pdf-images: fixtures
