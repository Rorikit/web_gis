# Документация web_gis

Sphinx-документация backend-части проекта, собранная на стеке `MyST + autodoc + autosummary + napoleon + sphinx-autodoc-typehints + Furo`.

Здесь собраны:

- обзор архитектуры проекта (backend на Django REST Framework, frontend на React/TypeScript);
- описание доменной модели (повреждения, ордера, GIS-точки, права доступа);
- автоматически подтягиваемые docstring из Python-кода backend;
- API-справка по ключевым представлениям, сериализаторам и сервисам.

```{toctree}
:maxdepth: 2
:caption: Содержание

overview
api_reference
```
