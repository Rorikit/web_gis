# API-справка

Эта страница объединяет два уровня документации:

- короткое человеческое описание роли каждого модуля backend;
- автоматически сгенерированную API-справку по классам и функциям из исходного кода.

В проекте нет ручных docstring, поэтому справка ниже показывает точные сигнатуры и состав
классов/методов — читать код всё равно нужно для деталей реализации, но структура API видна
без переключения в IDE.

## Ключевые классы и функции

```{eval-rst}
.. autosummary::
   :nosignatures:

   apps.accounts.views.LoginView
   apps.accounts.views.LogoutView
   apps.accounts.views.MeView
   apps.accounts.permissions.has_permission
   apps.accounts.permissions.can_access_district
   apps.incidents.views.DamageListCreateView
   apps.incidents.views.DamageDetailView
   apps.incidents.views.OrdersListView
   apps.incidents.views.OrderDetailView
   apps.incidents.views.GisDamagePointView
   apps.incidents.views.GisOrderPointView
   apps.incidents.views.DamageCardReportView
   apps.incidents.views.ReferenceReportView
   apps.incidents.services.apply_damage_changes
   apps.incidents.services.apply_order_changes
   apps.incidents.reports.build_damage_card_document
   apps.incidents.reports.build_reference_workbook
   apps.health.views.HealthView
```

## Аутентификация и пользователи

Модуль `apps.accounts.views` реализует сессионную аутентификацию: вход по логину/паролю
(`LoginView`), выход (`LogoutView`) и получение текущего пользователя вместе с установкой
CSRF-cookie (`MeView`). Несмотря на путь `/auth/ldap/login` (сохранён для совместимости с
исходным ТЗ на интеграцию с LDAP), фактически используется стандартная аутентификация Django —
реальная интеграция с LDAP/Active Directory не реализована.

```{eval-rst}
.. automodule:: apps.accounts.views
   :members:
   :show-inheritance:
```

## Модель пользователей и районов

Модуль `apps.accounts.models` описывает справочник районов (`District`), роли пользователей
(`UserRole`) и профиль пользователя (`UserProfile`), расширяющий стандартную модель
`django.contrib.auth`.

```{eval-rst}
.. automodule:: apps.accounts.models
   :members:
   :show-inheritance:
```

## Права доступа

Модуль `apps.accounts.permissions` — единственный источник истины по правам на backend: матрица
`PERMISSION_MATRIX` связывает роль с разрешёнными действиями, а `can_access_district` определяет,
видит ли пользователь конкретный район. Аналогичная матрица прав продублирована на frontend
(`src/features/permissions/model/permissions.ts`) и должна обновляться синхронно при изменении
ролей.

```{eval-rst}
.. automodule:: apps.accounts.permissions
   :members:
   :show-inheritance:
```

## Повреждения и ордера

Модуль `apps.incidents.views` — основной API-слой предметной области. Повреждения и ордера
представлены одной и той же моделью `Damage`; отдельные представления (`DamageListCreateView`
и `OrdersListView`/`OrderDetailView`) лишь по-разному сериализуют и фильтруют одни и те же
записи. Здесь же находятся endpoint'ы архивации, сохранения GIS-точек и выгрузки отчётов.

```{eval-rst}
.. automodule:: apps.incidents.views
   :members:
   :show-inheritance:
```

## Доменная модель повреждений

Модуль `apps.incidents.models` описывает `Damage` (совмещает поля повреждения и ордера),
`GisPoint`, `Photo` и `AuditEvent`, а также справочные `TextChoices` (`NetworkType`, `DamageType`,
`OrderKind`, `AreaState`, `ContractorType`).

```{eval-rst}
.. automodule:: apps.incidents.models
   :members:
   :show-inheritance:
```

## Сериализация

Модуль `apps.incidents.serializers` содержит DRF-сериализаторы для входных данных
(`DamageWriteSerializer`, `OrderWriteSerializer`, `GisPointWriteSerializer`,
`UserWriteSerializer`) и функции сериализации ответов (`serialize_damage`, `serialize_order`,
`serialize_gis_point`, `serialize_photo`, `serialize_audit_event`). Адрес GIS-точки при отдаче
клиенту всегда берётся из актуального поля `address` родительской записи, а не из ранее
сохранённого значения на самой точке.

```{eval-rst}
.. automodule:: apps.incidents.serializers
   :members:
   :show-inheritance:
```

## Бизнес-логика изменений

Модуль `apps.incidents.services` применяет частичные изменения к повреждению/ордеру
(`apply_damage_changes`, `apply_order_changes`), формирует значения по умолчанию для новой
записи (`default_damage_payload`) и пишет события аудита (`create_audit_event`) при каждом
значимом изменении поля.

```{eval-rst}
.. automodule:: apps.incidents.services
   :members:
   :show-inheritance:
```

## Формирование отчётов

Модуль `apps.incidents.reports` генерирует файлы без внешних шаблонов: DOCX-карту повреждения
(`build_damage_card_document`, через `python-docx`) и XLSX-справку по текущим повреждениям и
ордерам (`build_reference_workbook`, через `openpyxl`).

```{eval-rst}
.. automodule:: apps.incidents.reports
   :members:
   :show-inheritance:
```

## Health-check

Модуль `apps.health.views` отдаёт `HealthView` — служебный endpoint для проверки доступности
приложения и БД, используется Docker healthcheck'ом и внешним мониторингом.

```{eval-rst}
.. automodule:: apps.health.views
   :members:
   :show-inheritance:
```
