# Production-деплой web_gis

Проект подготовлен к production-запуску через Docker Compose. Стек включает:

- `web` — Nginx со статической production-сборкой React;
- `backend` — Django под Gunicorn;
- `db` — PostgreSQL/PostGIS;
- общий volume со статикой Django Admin;
- внутреннюю Docker-сеть, в которой находятся backend и БД.

Снаружи публикуется только HTTP-порт web-контейнера, по умолчанию
`127.0.0.1:8080`. На production-сервере перед ним должен находиться системный Nginx,
балансировщик или ingress, завершающий HTTPS.

```text
Браузер
   |
   | HTTPS :443
   v
Системный Nginx / ingress
   |
   | HTTP 127.0.0.1:8080
   v
web-контейнер (Nginx)
   |-- /, /assets/*  -> React SPA
   |-- /static/*     -> Django Admin static
   `-- /api/*        -> Gunicorn/Django -> PostGIS
```

## 1. Production-файлы проекта

- `docker-compose.prod.yml` — production-сервисы, volumes, сети и healthchecks;
- `Dockerfile.prod` — multi-stage сборка frontend и образ Nginx;
- `deploy/nginx/app.conf` — SPA fallback, статика и proxy `/api/`;
- `.env.production.example` — полный шаблон production-переменных;
- `backend/Dockerfile` — образ backend;
- `backend/entrypoint.sh` — миграции, collectstatic и запуск Gunicorn;
- `backend/config/settings.py` — proxy, HTTPS и cookie security-настройки.

Dev-команды из `README.md` продолжают работать отдельно. Production Compose не использует
Vite dev server, Django `runserver`, bind-mount исходников или публичные порты БД.

## 2. Требования к серверу

Минимально необходимы:

- Linux x86-64/ARM64, поддерживаемый выбранными Docker-образами;
- Docker Engine и Docker Compose plugin;
- Git либо другой способ доставки репозитория;
- доменное имя с DNS-записью на сервер;
- TLS-сертификат;
- системный reverse proxy: Nginx, HAProxy, Traefik или ingress.

Node.js и Python на сервере не нужны: обе сборки выполняются внутри Docker.

Проверьте Docker:

```bash
docker --version
docker compose version
```

Во внешнем firewall откройте только:

- `22/tcp` для SSH, желательно из доверенной сети;
- `80/tcp` для редиректа и ACME challenge;
- `443/tcp` для приложения.

Порты `5432`, `8000` и `8080` не должны быть доступны из интернета. По умолчанию `8080`
привязан только к `127.0.0.1`.

## 3. Получение кода

Пример размещения в `/opt/web_gis`:

```bash
sudo mkdir -p /opt/web_gis
sudo chown "$USER":"$USER" /opt/web_gis
git clone <URL_РЕПОЗИТОРИЯ> /opt/web_gis
cd /opt/web_gis
git fetch --tags
git checkout <ТЕГ_ИЛИ_COMMIT>
```

Для production лучше разворачивать проверенный tag/commit, а не произвольное состояние
ветки `main`.

## 4. Production-окружение

Создайте локальный файл окружения:

```bash
cd /opt/web_gis
cp .env.production.example .env.production
chmod 600 .env.production
```

`.env.production` добавлен в `.gitignore` и не должен попадать в Git, backup исходников,
CI-артефакты или сообщения с логами.

Сгенерируйте два независимых секрета:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Первое значение используйте как `DJANGO_SECRET_KEY`, второе — как `POSTGRES_PASSWORD`.

Обязательные изменения в `.env.production`:

```env
DJANGO_SECRET_KEY=<СЛУЧАЙНЫЙ_СЕКРЕТ_DJANGO>
POSTGRES_PASSWORD=<СЛУЧАЙНЫЙ_ПАРОЛЬ_POSTGRES>

DJANGO_ALLOWED_HOSTS=gis.example.ru
DJANGO_CORS_ALLOWED_ORIGINS=https://gis.example.ru
DJANGO_CSRF_TRUSTED_ORIGINS=https://gis.example.ru
```

Замените `gis.example.ru` на настоящий домен.

### Основные production-значения

Оставьте следующие настройки выключенными или включёнными именно так:

```env
DJANGO_DEBUG=false
DJANGO_BOOTSTRAP_DEV_AUTH=false
DJANGO_SESSION_COOKIE_SECURE=true
DJANGO_CSRF_COOKIE_SECURE=true
DJANGO_SECURE_SSL_REDIRECT=true
VITE_ENABLE_MOCK_FALLBACK=false
VITE_API_URL=/api
VITE_BASE_PATH=/
WEB_BIND=127.0.0.1
WEB_PORT=8080
```

Причины:

- `DJANGO_BOOTSTRAP_DEV_AUTH=true` создаёт пользователей с известными тестовыми паролями;
- mock fallback может подменять ошибку API локальными данными/файлами-заглушками;
- `VITE_API_URL=/api` сохраняет frontend и session API на одном origin;
- привязка `WEB_BIND=127.0.0.1` запрещает обход HTTPS reverse proxy.

`VITE_*` не являются секретами: они встраиваются в JavaScript во время `docker compose
build web` и доступны пользователю браузера. После их изменения образ `web` необходимо
пересобрать.

### HSTS

В шаблоне установлено:

```env
DJANGO_SECURE_HSTS_SECONDS=0
```

Сначала проверьте HTTPS, все поддомены и автоматическое обновление сертификата. Затем можно
постепенно увеличить срок. Не включайте `HSTS_PRELOAD` без отдельного осознанного решения:
ошибка может надолго сделать домен недоступным по HTTP.

## 5. Проверка конфигурации

Compose использует `.env.production` и для подстановок при сборке, и как окружение Django и
PostgreSQL:

```bash
cd /opt/web_gis
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

Не публикуйте полный вывод команды `docker compose config`: он содержит раскрытые секреты.

## 6. Сборка и первый запуск

Соберите образы:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
```

Во время сборки:

- backend устанавливает Python-зависимости, включая Gunicorn;
- frontend выполняет `npm ci`, TypeScript build и Vite build;
- итоговый frontend копируется в минимальный Nginx-образ.

Запустите стек:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Порядок старта контролируется healthchecks:

1. PostGIS должен стать healthy;
2. backend применяет миграции и собирает Django static;
3. Gunicorn должен вернуть успешный `/health/`;
4. после этого запускается web-контейнер.

Посмотрите стартовые логи:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=150 db
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=150 backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=150 web
```

Проверьте web и API до настройки внешнего Nginx. Заголовок имитирует исходный HTTPS-запрос:

```bash
curl --fail --show-error http://127.0.0.1:8080/healthz
curl --fail --show-error \
  -H 'Host: gis.example.ru' \
  -H 'X-Forwarded-Proto: https' \
  http://127.0.0.1:8080/api/health/
```

Ожидаемый API-ответ:

```json
{"status":"ok","services":{"database":"ok"}}
```

## 7. HTTPS reverse proxy

Ниже пример системного Nginx. TLS может завершаться и на внешнем балансировщике — тогда
важно сохранить `Host`, `X-Forwarded-For` и `X-Forwarded-Proto`.

Создайте `/etc/nginx/sites-available/web_gis`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name gis.example.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gis.example.ru;

    ssl_certificate     /etc/letsencrypt/live/gis.example.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gis.example.ru/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 120s;
    }
}
```

Замените домен и пути сертификата. Сертификат должен быть выпущен до активации HTTPS-блока.

Проверка и reload:

```bash
sudo ln -s /etc/nginx/sites-available/web_gis /etc/nginx/sites-enabled/web_gis
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Первый администратор

Создайте суперпользователя:

```bash
cd /opt/web_gis
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec backend python manage.py createsuperuser
```

Проект автоматически создаст ему профиль с ролью `admin`.

Важно: endpoint называется `/auth/ldap/login`, но текущий код использует стандартную
Django-аутентификацию. Реальная интеграция с LDAP/Active Directory пока не реализована.
До её внедрения пользователи входят с Django username/password.

## 9. Финальная проверка

Проверьте контейнеры:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Все три сервиса должны иметь состояние `running`, а сервисы с healthcheck — `healthy`.

Проверьте Django security checklist:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec backend python manage.py check --deploy
```

Проверьте публичные адреса:

```bash
curl --fail --show-error https://gis.example.ru/healthz
curl --fail --show-error https://gis.example.ru/api/health/
curl -I https://gis.example.ru/
```

В браузере проверьте:

1. прямое открытие `/auth`;
2. вход production-администратором;
3. перезагрузку на `/damages`, `/orders` и других SPA-маршрутах;
4. запросы во вкладке Network — они должны идти на `/api/*`;
5. cookie `sessionid` и `csrftoken` должны иметь флаг `Secure`;
6. CRUD-сценарии и ролевые ограничения;
7. выход из системы;
8. отсутствие CSRF/CORS/500 ошибок.

Backend пока не реализует `/reports/*` и `/exports/*`. При отключённом mock fallback эти
функции будут честно возвращать ошибку до реализации серверной части.

Неиспользуемая frontend-зависимость `xlsx` удалена из production-кода: опубликованная npm
версия имеет известные уязвимости без доступного автоматического исправления. XLSX-файлы
следует формировать серверным endpoint-ом экспорта либо вернуть клиентскую генерацию на
поддерживаемой библиотеке после отдельной проверки безопасности.

## 10. Обновление

Перед обновлением сделайте backup БД. Затем:

```bash
cd /opt/web_gis
git fetch --tags
git checkout <НОВЫЙ_ТЕГ_ИЛИ_COMMIT>
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl --fail --show-error https://gis.example.ru/api/health/
```

Entry point автоматически выполняет `migrate --noinput` и `collectstatic --noinput` при
старте нового backend-контейнера.

Просмотрите логи после релиза:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 web
```

Очистка неиспользуемых старых образов выполняется отдельно и только после успешной проверки
релиза:

```bash
docker image prune
```

## 11. Backup PostgreSQL

Создание backup в custom-формате:

```bash
sudo mkdir -p /opt/backups/web_gis
cd /opt/web_gis
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > /opt/backups/web_gis/web_gis_$(date +%F_%H-%M-%S).dump
```

Проверяйте, что файл не пуст, переносите копии на отдельное хранилище и регулярно тестируйте
восстановление на staging.

Общая форма восстановления:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop backend
cat <BACKUP.dump> | docker compose --env-file .env.production \
  -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists'
docker compose --env-file .env.production -f docker-compose.prod.yml start backend
```

Восстановление перезаписывает данные. Сначала отработайте процедуру на отдельной БД.

## 12. Откат

Откат кода:

```bash
cd /opt/web_gis
git checkout <ПРЕДЫДУЩИЙ_ТЕГ_ИЛИ_COMMIT>
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Откат кода не гарантирует совместимость с уже применённой миграцией БД. До релиза изучите
миграции и подготовьте отдельный план восстановления данных. Не запускайте обратные
миграции автоматически без проверки.

## 13. Диагностика

### Сервис не стартует

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=250 backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=250 db
```

Частые причины: placeholder вместо секрета, неверный пароль БД, ошибка миграции или занятый
порт `8080`.

### 400 Bad Request

Домен отсутствует в `DJANGO_ALLOWED_HOSTS`. Укажите hostname без `https://` и пересоздайте
backend:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  up -d --force-recreate backend
```

### 403 CSRF Failed

Проверьте:

- `DJANGO_CSRF_TRUSTED_ORIGINS=https://<домен>`;
- точное совпадение протокола и домена;
- `X-Forwarded-Proto: https` от внешнего proxy;
- наличие `csrftoken` в браузере;
- отсутствие старых cookie от предыдущего домена.

### 502 Bad Gateway

Проверьте локальную точку входа и healthchecks:

```bash
curl http://127.0.0.1:8080/healthz
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 web
```

### `/api/health/` возвращает 503

Django работает, но не может обратиться к БД. Проверьте состояние `db`, одинаковые
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` и наличие `POSTGRES_HOST=db`.

### Frontend обращается к `127.0.0.1:8000`

Используется старый frontend-образ или при сборке не был передан `.env.production`.
Пересоберите без cache:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache web
docker compose --env-file .env.production -f docker-compose.prod.yml up -d web
```

### 404 после обновления SPA-маршрута

Убедитесь, что запрос попадает в web-контейнер. В `deploy/nginx/app.conf` уже настроен
fallback `try_files $uri $uri/ /index.html`.
