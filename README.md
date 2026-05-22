# Система учета повреждений теплосетей (Frontend)

SPA-приложение для учета повреждений теплосетей, работы с ордерами, просмотра GIS-точек и формирования отчетов.

## Что умеет приложение

- LDAP-вход пользователя (через API `auth`)
- Разделы:
  - активные/архивные повреждения
  - активные/архивные ордера
  - GIS-карта ордеров
  - карточки повреждения и ордера
  - администрирование пользователей
  - формирование отчетов (`XLSX`, `DOCX`)
- Ролевая модель доступа (`district_damage`, `district_order`, `oopppr`, `full_access`, `admin`)
- Ограничение доступа по району
- Fallback на мок-данные при недоступности backend в dev-сценариях

## Технологии

- `React 19` + `TypeScript`
- `Vite 6`
- `React Router 7`
- `@tanstack/react-query`
- `@tanstack/react-table`
- `OpenLayers` (`ol`) для карт
- `axios`, `react-hook-form`, `zod`, `zustand`
- Экспорт документов: `xlsx`, `docx`

## Требования

- `Node.js` 20+ (в CI используется Node 24)
- `npm` 10+

Проверка версий:

```bash
node -v
npm -v
```

## Быстрый старт

### 1. Клонирование

```bash
git clone <repo-url>
cd web_gis
```

### 2. Установка зависимостей

```bash
npm ci
```

### 3. Настройка переменных окружения

Создайте `.env` из шаблона:

```bash
cp .env.example .env
```

Пример `.env`:

```env
VITE_API_URL=https://api.example.local
VITE_GIS_API_URL=https://gis.example.local
VITE_APP_NAME=Система учета повреждений теплосетей
```

Описание переменных:

- `VITE_API_URL` - базовый URL основного API (используется `axios`-клиентом)
- `VITE_GIS_API_URL` - URL GIS API (зарезервирован в конфигурации)
- `VITE_APP_NAME` - название системы в верхней панели
- `VITE_BASE_PATH` - необязательный base path для сборки (например, `/web_gis/` для GitHub Pages)

### 4. Запуск dev-сервера

```bash
npm run dev
```

По умолчанию Vite поднимается на `http://127.0.0.1:5173`.

### 5. Логин в dev

На странице входа дефолтно подставлен пользователь `admin`. Если backend недоступен и срабатывает mock fallback, вход выполнится на мок-пользователе.

## Команды проекта

```bash
npm run dev        # запуск локального dev-сервера
npm run typecheck  # проверка TypeScript
npm run lint       # проверка ESLint
npm run build      # production-сборка (включая fallback 404.html)
npm run preview    # локальный просмотр production-сборки
```

## Сборка и production-запуск

### Production-сборка

```bash
npm run build
```

Что делает скрипт:

1. `tsc -b` - проверка/сборка TypeScript-проектов
2. `vite build` - сборка фронтенда в `dist/`
3. `node scripts/copy-spa-fallback.mjs` - копирует `dist/index.html` в `dist/404.html` (нужно для SPA-fallback на статическом хостинге)

### Локальный preview сборки

```bash
npm run preview
```

## Структура проекта

```text
.
├── .env.example
├── .github/
│   └── workflows/
│       └── pages.yml
├── scripts/
│   └── copy-spa-fallback.mjs
├── src/
│   ├── app/
│   │   ├── guards/
│   │   ├── layouts/
│   │   ├── providers/
│   │   ├── router/
│   │   └── App.tsx
│   ├── entities/
│   ├── features/
│   ├── pages/
│   ├── shared/
│   └── widgets/
├── index.html
├── vite.config.ts
├── tsconfig*.json
└── package.json
```

### Назначение ключевых директорий

- `src/app` - каркас приложения: роутинг, layout, guards, глобальные провайдеры
- `src/pages` - страницы, привязанные к маршрутам
- `src/features` - прикладная логика и hooks по доменам (`damages`, `orders`, `gis`, `users`, `reports`)
- `src/widgets` - крупные композиционные UI-блоки (`AppShell`, карточки, панели)
- `src/entities` - типы доменных сущностей (`Damage`, `Order`, `User`, ...)
- `src/shared` - переиспользуемые компоненты, API-клиенты, конфиги, константы, утилиты
- `scripts` - утилиты сборки и деплоя

## Маршруты и доступы

Базовые маршруты задаются в `src/app/router/router.tsx`.

- `/auth` - авторизация
- `/dashboard` - главная
- `/damages`, `/damages/archive`, `/damages/:id`
- `/orders`, `/orders/archive`, `/orders/:id`
- `/map/orders`
- `/oopppr`, `/oopppr/archive`
- `/full-access`
- `/admin`, `/admin/users`
- `/access-denied`

Контроль доступа:

- `AuthGuard` - проверка факта авторизации
- `RoleGuard` - проверка прав на раздел
- проверка районов для карточек записей

## Работа с API и mock fallback

Основной HTTP-клиент расположен в `src/shared/api/http-client.ts` и использует `VITE_API_URL`.

Поведение при ошибках:

- `401` -> редирект на `/auth`
- `403` -> редирект на `/access-denied`

Во многих API-модулях (`damages`, `orders`, `gis`, `users`, `auth`, `reports`, `exports`, `audit`) реализован fallback на `mockStore`, если:

- API недоступен по сети
- backend вернул `404` с `text/html` (типичный случай, когда запрос ушел не в API, а в статическую страницу)

Mock-данные находятся в `src/shared/api/mock-data.ts`.

## Деплой

В репозитории есть workflow `.github/workflows/pages.yml`:

- запускается на `push` в `main`
- выполняет `npm ci`, `typecheck`, `lint`, `build`
- собирает с `VITE_BASE_PATH=/web_gis/`
- деплоит `dist/` на GitHub Pages

## Частые проблемы

### `npm ci` не выполняется

Проверьте версии `node`/`npm` и доступ к npm registry.

### После деплоя открывается пустая страница или 404

Убедитесь, что:

- задан корректный `VITE_BASE_PATH`
- в `dist/` есть `404.html` (создается скриптом `copy-spa-fallback.mjs`)

### Данные не приходят с backend

Проверьте:

- `VITE_API_URL` в `.env`
- CORS/куки на backend (клиент работает с `withCredentials: true`)
- ответы API на ожидаемых endpoint-ах

## Полезно для разработки

- Алиас `@` указывает на `src` (см. `vite.config.ts` и `tsconfig.app.json`)
- Глобальные стили: `src/shared/styles/global.css`
- Ключи React Query: `src/shared/types/query.ts`
