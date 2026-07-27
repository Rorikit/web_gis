# API Contract (v1) for `web_gis` Frontend

Дата фиксации: 2026-05-22  
Статус: draft (источник истины для первой интеграции FE и Django BE)

## 1. Scope

Этот документ фиксирует API-контракт, который ожидает текущий фронтенд (`src/shared/api/*`).

Цель:
- избежать расхождений при старте backend;
- сразу обеспечить рабочую интеграцию без доработок фронта;
- зафиксировать обязательные коды/форматы ответов.

## 2. Общие правила

### 2.1 Base URL

- Все запросы идут через `VITE_API_URL`.
- Клиент отправляет `withCredentials: true` (cookie-based auth/session).

### 2.2 Формат ответов

- Для JSON endpoint-ов ожидается `application/json`.
- Для list endpoint-ов фронт ожидает **голый массив**, не envelope:
  - корректно: `[{...}, {...}]`
  - некорректно для текущего FE: `{ "results": [...] }`
- Для detail/create/update/archive фронт ожидает JSON-объект сущности.
- Для файловых endpoint-ов ожидается бинарный `Blob`.

### 2.3 Обработка ошибок

Критично для текущего фронта:
- `401` -> фронт редиректит на `/auth`;
- `403` -> фронт редиректит на `/access-denied`.

Рекомендуемые коды:
- `400` - ошибка валидации;
- `404` - сущность не найдена;
- `500` - внутренняя ошибка.

Рекомендуемый формат body ошибок (не обязателен для текущего FE, но полезен для DX):

```json
{
  "detail": "Validation error",
  "code": "validation_error",
  "errors": {
    "fieldName": ["error text"]
  }
}
```

### 2.4 Форматы дат

- `date`: `YYYY-MM-DD` (например `detectedAt`, `plannedFinishDate`);
- `datetime`: ISO 8601 (например `createdAt`, `updatedAt`, `lastLoginAt`).

## 3. Справочник сущностей

## 3.1 UserRole

```text
district_damage | district_order | oopppr | full_access | admin
```

## 3.2 User

```json
{
  "id": "string",
  "ldapLogin": "string",
  "fullName": "string",
  "role": "district_damage|district_order|oopppr|full_access|admin",
  "districtId": "string|null",
  "isActive": "boolean",
  "lastLoginAt": "string|null"
}
```

## 3.3 GisPoint

```json
{
  "id": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "gisObjectId": "string",
  "mapUrl": "string"
}
```

## 3.4 Photo

```json
{
  "id": "string",
  "url": "string",
  "fileName": "string",
  "uploadedAt": "string"
}
```

## 3.5 Damage

Enums:

```text
networkType: ОТ | ГВС
damageType: Текущее | Гидравлическое
orderKind: Текущий | Гарантийный
areaState: В РАБОТЕ | ГОТОВ К ЗАКРЫТИЮ
contractorType: Подрядчик | УРТС | Участок
```

```json
{
  "id": "string",
  "districtId": "string",
  "address": "string",
  "networkType": "ОТ|ГВС",
  "detectedAt": "string",
  "fixedAt": "string|null",
  "orderNumber": "string",
  "orderOpenedAt": "string",
  "orderValidUntil": "string",
  "heatSource": "string",
  "damageType": "Текущее|Гидравлическое",
  "disconnectedConsumers": "number",
  "damageDescription": "string",
  "orderKind": "Текущий|Гарантийный",
  "greenZoneArea": "number",
  "asphaltArea": "number",
  "improvementMain": "boolean",
  "improvementInnerRoad": "boolean",
  "improvementSidewalk": "boolean",
  "improvementBlindArea": "boolean",
  "curbCount": "number",
  "areaState": "В РАБОТЕ|ГОТОВ К ЗАКРЫТИЮ",
  "contractorType": "Подрядчик|УРТС|Участок",
  "contractNumber": "string",
  "contractorRequestDate": "string|null",
  "plannedFinishDate": "string|null",
  "note": "string",
  "orderClosedAt": "string|null",
  "gisPoint": "GisPoint|null",
  "photos": "Photo[]",
  "createdAt": "string",
  "updatedAt": "string",
  "archived": "boolean"
}
```

## 3.6 Order

```json
{
  "id": "string",
  "districtId": "string",
  "orderNumber": "string",
  "address": "string",
  "orderKind": "Текущий|Гарантийный",
  "openedAt": "string",
  "validUntil": "string",
  "closedAt": "string|null",
  "areaState": "В РАБОТЕ|ГОТОВ К ЗАКРЫТИЮ",
  "contractorType": "Подрядчик|УРТС|Участок",
  "contractorName": "string",
  "contractNumber": "string",
  "plannedFinishDate": "string|null",
  "note": "string",
  "gisPoint": "GisPoint|null",
  "archived": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## 3.7 AuditEvent

```json
{
  "id": "string",
  "entityType": "damage|order|user|string",
  "entityId": "string",
  "userId": "string",
  "userName": "string",
  "fieldName": "string",
  "oldValue": "string",
  "newValue": "string",
  "createdAt": "string"
}
```

## 4. Endpoint-ы (обязательные для FE)

## 4.1 Auth

### POST `/auth/ldap/login`

- Auth: не требуется
- Body:

```json
{
  "ldapLogin": "string",
  "password": "string"
}
```

- Success:
  - `200` -> `User`
- Errors:
  - `401` (неверные учетные данные)
  - `403` (нет роли / пользователь заблокирован)

### POST `/auth/logout`

- Auth: cookie/session (можно вызывать без активной сессии)
- Body: пустой
- Success:
  - `204`

### GET `/auth/me`

- Auth: cookie/session (если есть)
- Success:
  - `200` -> `User` при активной сессии
  - `200` -> `null` при отсутствии сессии

## 4.2 Damages

### GET `/damages`

- Auth: требуется (`damage.read`)
- Query:
  - `archived` (`true|false`, optional)
- Success:
  - `200` -> `Damage[]`

### GET `/damages/{id}`

- Auth: требуется (`damage.read` + доступ к району)
- Success:
  - `200` -> `Damage`
- Errors:
  - `404`
  - `403`

### POST `/damages`

- Auth: требуется (`damage.create`)
- Body: partial `Damage` (минимально для текущего UI критично поддерживать update-поля, см. ниже)
- Success:
  - `200` или `201` -> `Damage`
- Errors:
  - `400`
  - `403`

### PUT `/damages/{id}`

- Auth: требуется (`damage.update` + доступ к району)
- Body: partial `Damage`
- Фактически из текущей UI-формы гарантированно отправляются:
  - `address`
  - `heatSource`
  - `damageDescription`
  - `note`
- Success:
  - `200` -> `Damage`
- Errors:
  - `400`
  - `403`
  - `404`

### POST `/damages/{id}/archive`

- Auth: требуется (`damage.update`)
- Body: пустой
- Success:
  - `200` -> `Damage` (с `archived: true`)
- Errors:
  - `403`
  - `404`

## 4.3 Orders

### GET `/orders`

- Auth: требуется (`order.read`)
- Query:
  - `archived` (`true|false`, optional)
- Success:
  - `200` -> `Order[]`

### GET `/orders/{id}`

- Auth: требуется (`order.read` + доступ к району)
- Success:
  - `200` -> `Order`
- Errors:
  - `403`
  - `404`

### PUT `/orders/{id}`

- Auth: требуется (`order.update` или `ooppprFields.update` в зависимости от полей)
- Body: partial `Order`
- Фактически из текущей UI-формы отправляются:
  - `contractorName`
  - `contractNumber`
  - `plannedFinishDate`
  - `note`
- Success:
  - `200` -> `Order`
- Errors:
  - `400`
  - `403`
  - `404`

### POST `/orders/{id}/archive`

- Auth: требуется (`order.update`)
- Body: пустой
- Success:
  - `200` -> `Order` (с `archived: true`)
- Errors:
  - `403`
  - `404`

## 4.4 GIS

### GET `/gis/orders/open`

- Auth: требуется (`order.read`)
- Success:
  - `200` -> `Order[]`

### GET `/gis/orders/archive`

- Auth: требуется (`order.read`)
- Query:
  - `from` (`YYYY-MM-DD`, optional)
  - `to` (`YYYY-MM-DD`, optional)
- Success:
  - `200` -> `Order[]`

### POST `/gis/damages/{id}/point`

- Auth: требуется (`damage.update`)
- Body:

```json
{
  "latitude": 55.75,
  "longitude": 37.61
}
```

- Success:
  - `200` -> `Damage` (обновленная сущность с `gisPoint`)
- Errors:
  - `400`
  - `403`
  - `404`

### PUT `/gis/damages/{id}/point`

- Auth: требуется (`damage.update`)
- Body:

```json
{
  "latitude": 55.75,
  "longitude": 37.61
}
```

- Success:
  - `200` -> `Damage`
- Errors:
  - `400`
  - `403`
  - `404`

## 4.5 Users

### GET `/users`

- Auth: требуется (`users.read`)
- Success:
  - `200` -> `User[]`

### POST `/users`

- Auth: требуется (`users.create`)
- Body:
  - `ldapLogin` (обязательно, уникальный логин)
  - `password` (обязательно, проверяется стандартными валидаторами Django)
  - `fullName`
  - `role` (обязательно)
  - `districtId` (может быть `null`/пустым для “все районы”)
  - `isActive` (по умолчанию `true`)
- Success:
  - `201` -> `User`
- Errors:
  - `400` (невалидный пароль/район)
  - `403`
  - `409` (логин уже занят)

### PUT `/users/{id}`

- Auth: требуется (`users.update`)
- Body: partial `User`
- Фактически из UI отправляются:
  - `ldapLogin`
  - `fullName`
  - `role`
  - `districtId` (может быть `null`/пустое значение для “все районы”)
  - `isActive`
- Success:
  - `200` -> `User`
- Errors:
  - `400`
  - `403`
  - `404`
  - `409` (рекомендуется для бизнес-конфликтов: последний админ, попытка заблокировать себя)

## 4.6 Audit

### GET `/audit/{entityType}/{entityId}`

- Auth: требуется
- Success:
  - `200` -> `AuditEvent[]`

## 4.7 Reports

### POST `/reports/reference`

- Auth: требуется (`reports.createReference`)
- Body:

```json
{
  "reportDate": "YYYY-MM-DD"
}
```

- Success:
  - `200` -> файл (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### POST `/reports/damage-card`

- Auth: требуется (`reports.createDamageCard`)
- Body (текущий минимум из UI):

```json
{
  "damageId": "string",
  "additionalInfo": "string"
}
```

- Success:
  - `200` -> файл (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)

## 4.8 Exports

### POST `/exports/current-table`

- Auth: требуется (`damage.read` для `entityType: "damages"`, `order.read` для `entityType: "orders"`)
- Body:
  - `entityType`: `"damages" | "orders"` (по умолчанию `"damages"`)
  - `archived`: `boolean` (по умолчанию `false`)
- Район-скоуп применяется так же, как в `GET /damages` / `GET /orders`.
- Success:
  - `200` -> файл (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

## 5. Матрица прав (для backend)

```text
damage.create            -> district_damage, full_access, admin
damage.read              -> district_damage, district_order, oopppr, full_access, admin
damage.update            -> district_damage, full_access, admin
order.read               -> district_order, oopppr, full_access, admin
order.update             -> district_order, full_access, admin
ooppprFields.update      -> oopppr, full_access, admin
users.read               -> admin
users.create             -> admin
users.update             -> admin
reports.createReference  -> oopppr, full_access, admin
reports.createDamageCard -> district_damage, full_access, admin
```

Доступ по району:
- `admin`, `full_access`, `oopppr` -> все районы;
- `district_damage`, `district_order` -> только свой `districtId`.

## 6. Ограничения v1 и открытые вопросы

- В v1 list endpoint-ы без пагинации (возвращают полный массив).
- UI-фильтры карты пока не подключены к API полностью; контракт для расширенных фильтров будет v1.1.
- `VITE_GIS_API_URL` есть в env, но текущий фронт использует единый `VITE_API_URL` для всех запросов.
- Нужно отдельным шагом согласовать:
  - CSRF-стратегию для cookie auth;
  - единый формат ошибок и коды бизнес-конфликтов;
  - финальный payload для `/exports/current-table`.

## 7. Definition of Done для пункта 1

Пункт 1 считается выполненным, если:
- backend реализует все endpoint-ы из раздела 4;
- форматы ответов совместимы с разделом 2;
- роли и районные ограничения соответствуют разделу 5.
