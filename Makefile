PYTHON ?= python
DOCS_SOURCE := docs
DOCS_BUILD := docs/_build/html

.PHONY: docs docs-open docs-clean

docs:
	$(PYTHON) -m sphinx -b html $(DOCS_SOURCE) $(DOCS_BUILD)

docs-open: docs
	$(PYTHON) -m webbrowser "file://$(abspath $(DOCS_BUILD)/index.html)"

docs-clean:
	rm -rf docs/_build
