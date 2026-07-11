"""Sphinx configuration for the project documentation."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

project = "web_gis"
author = "web_gis Team"
release = "0.1.0"
language = "ru"

extensions = [
    "myst_parser",
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx_autodoc_typehints",
]

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

autosummary_generate = True
autosummary_generate_overwrite = True
autoclass_content = "both"
autodoc_class_signature = "separated"
autodoc_member_order = "bysource"
autodoc_preserve_defaults = True
autodoc_typehints = "signature"
autodoc_default_options = {
    "members": True,
    "show-inheritance": True,
}

add_module_names = False
python_use_unqualified_type_names = True
always_document_param_types = False
simplify_optional_unions = True
typehints_defaults = "comma"
typehints_document_rtype = False
typehints_fully_qualified = False
typehints_use_rtype = False
toc_object_entries_show_parents = "hide"

napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_use_param = True
napoleon_use_rtype = False

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "fieldlist",
]

html_theme = "furo"
html_title = "web_gis Docs"
