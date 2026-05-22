# Система учета повреждений теплосетей

Проект состоит из двух частей:

- frontend SPA на `React + TypeScript`;
- backend-каркас на `Django + DRF` (в стадии интеграции по `API_CONTRACT.md`).

## Текущее состояние

- Frontend реализует страницы, роли, маршруты, таблицы, GIS-карту и экспортные сценарии.
- Backend пока содержит инфраструктурный каркас и базовый health endpoint `GET /health/`.
- При недоступности backend frontend использует mock fallback для большинства API-модулей.

## Функциональность frontend

- экран входа (LDAP-сценарий предусмотрен API-контрактом);
- разделы:
  - активные/архивные повреждения;
  - активные/архивные ордера;
  - GIS-карта ордеров;
  - карточки повреждения и ордера;
  - администрирование пользователей;
  - формирование отчетов (`XLSX`, `DOCX`);
- ролевая модель доступа (`district_damage`, `district_order`, `oopppr`, `full_access`, `admin`);
- ограничение доступа по району.

## Технологии

### Frontend

- `React 19` + `TypeScript`
- `Vite 6`
- `React Router 7`
- `@tanstack/react-query`, `@tanstack/react-table`
- `OpenLayers` (`ol`)
- `axios`, `react-hook-form`, `zod`, `zustand`
- `xlsx`, `docx`

### Backend

- `Django 5.2+`
- `Django REST Framework`
- `django-cors-headers`
- `PostgreSQL/PostGIS`
- `Redis`

## Требования

- `Node.js` 20+ (`CI` использует Node 24)
- `npm` 10+
- `Docker` + `Docker Compose` (для backend-окружения)

Проверка версий:

```bash
node -v
npm -v
docker --version
docker compose version
```

## Быстрый старт frontend

### 1. Клонирование

```bash
git clone <repo-url>
cd web_gis
```

### 2. Установка зависимостей

```bash
npm ci
```

### 3. Настройка переменных окружения frontend

```bash
cp .env.example .env
```

Пример `.env`:

```env
VITE_API_URL=https://api.example.local
VITE_GIS_API_URL=https://gis.example.local
VITE_APP_NAME=Система учета повреждений теплосетей
```

Описание:

- `VITE_API_URL` - базовый URL API;
- `VITE_GIS_API_URL` - зарезервированный URL GIS API (в текущем коде не используется отдельным клиентом);
- `VITE_APP_NAME` - название системы в topbar;
- `VITE_BASE_PATH` - опциональный base path для сборки (например `/web_gis/` для GitHub Pages).

### 4. Запуск frontend

```bash
npm run dev
```

Vite по умолчанию стартует на `http://127.0.0.1:5173`.

## Быстрый старт backend (Docker)

### 1. Настройка backend env

```bash
cp backend/.env.example backend/.env
```

### 2. Запуск backend + PostGIS + Redis

```bash
docker compose -f docker-compose.backend.yml up --build
```

При `DJANGO_BOOTSTRAP_DEV_AUTH=true` backend автоматически создаст тестовые районы и пользователей для входа.

- `admin / admin` (роль `admin`)
- `ivanov / ivanov` (роль `district_damage`)
- `petrova / petrova` (роль `oopppr`)
- `sidorov / sidorov` (роль `district_order`)

### 3. Проверка health endpoint

```bash
curl http://127.0.0.1:8000/health/
```

Ожидаемый ответ при доступной БД:

```json
{
  "status": "ok",
  "services": {
    "database": "ok"
  }
}
```

Если БД недоступна, endpoint возвращает `503` и `database: error`.

### 4. Проверка auth endpoint-ов

```bash
curl -X POST http://127.0.0.1:8000/auth/ldap/login \
  -H 'Content-Type: application/json' \
  -d '{\"ldapLogin\":\"admin\",\"password\":\"admin\"}'
```

## Команды проекта

### Frontend

```bash
npm run dev        # запуск dev-сервера
npm run typecheck  # проверка TypeScript
npm run lint       # проверка ESLint
npm run build      # production-сборка + создание dist/404.html
npm run preview    # локальный preview production-сборки
```

## API Contract

Файл `API_CONTRACT.md` - это единый контракт между frontend и backend:

- endpoint-ы;
- payload-ы;
- форматы ответов;
- коды ошибок;
- требования по ролям и доступу.

Почему его важно обновлять при изменениях:

- чтобы frontend и backend не расходились по форматам;
- чтобы изменения API не ломали существующие экраны;
- чтобы у команды был один источник истины для разработки и ревью.

## Структура проекта

```text
.
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   └── health/
│   ├── config/
│   ├── .env.example
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── manage.py
│   └── requirements.txt
├── .env.example
├── .github/
│   └── workflows/
│       └── pages.yml
├── API_CONTRACT.md
├── docker-compose.backend.yml
├── scripts/
│   └── copy-spa-fallback.mjs
├── src/
│   ├── app/
│   ├── entities/
│   ├── features/
│   ├── pages/
│   ├── shared/
│   └── widgets/
├── index.html
├── package.json
└── vite.config.ts
```

Назначение ключевых директорий:

- `src/app` - каркас frontend-приложения (router/layout/providers/guards);
- `src/pages` - страницы, привязанные к маршрутам;
- `src/features` - прикладная логика и hooks по доменам;
- `src/widgets` - крупные UI-композиции;
- `src/entities` - доменные типы;
- `src/shared` - общий UI, API-клиенты, конфиги, утилиты;
- `backend` - каркас Django backend и его конфигурация;
- `scripts` - скрипты сборки и вспомогательные утилиты.

## Маршруты frontend

Маршруты описаны в `src/app/router/router.tsx`:

- `/auth`
- `/dashboard`
- `/damages`, `/damages/archive`, `/damages/:id`
- `/orders`, `/orders/archive`, `/orders/:id`
- `/map/orders`
- `/oopppr`, `/oopppr/archive`
- `/full-access`
- `/admin`, `/admin/users`
- `/access-denied`

Контроль доступа:

- `AuthGuard`;
- `RoleGuard`;
- проверка доступа по району.

## API и mock fallback

Основной HTTP-клиент frontend находится в `src/shared/api/http-client.ts` и использует `VITE_API_URL`.

Поведение при ошибках:

- `401` -> редирект на `/auth`;
- `403` -> редирект на `/access-denied`.

Во многих API-модулях реализован fallback на `mockStore`, если:

- API недоступен по сети;
- backend вернул `404` с `text/html`.

Mock-данные: `src/shared/api/mock-data.ts`.

## Деплой frontend

В репозитории есть workflow `.github/workflows/pages.yml`:

- запуск на `push` в `main`;
- `npm ci`, `typecheck`, `lint`, `build`;
- сборка с `VITE_BASE_PATH=/web_gis/`;
- деплой `dist/` на GitHub Pages.

## Частые проблемы

### `npm ci` не выполняется

Проверьте версии `node`/`npm` и доступ к npm registry.

### После деплоя frontend открывается пустая страница или 404

Проверьте:

- корректность `VITE_BASE_PATH`;
- наличие `dist/404.html` (создается `scripts/copy-spa-fallback.mjs`).

### Frontend не получает данные с backend

Проверьте:

- `VITE_API_URL` в `.env`;
- CORS/cookie-настройки backend;
- соответствие backend контракту в `API_CONTRACT.md`.

### Backend не стартует через Docker

Проверьте:

- наличие `backend/.env`;
- что порты `5432`, `6379`, `8000` не заняты;
- логи: `docker compose -f docker-compose.backend.yml logs -f backend`.
