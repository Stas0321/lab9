# Лабораторна №9 — CI/CD and Continuous Testing

Окремий проєкт SUT B, підгрупа 2, варіант 08. Відкрий `Lab9.code-workspace` у цій папці. Репозиторій: [Stas0321/lab9](https://github.com/Stas0321/lab9).

## Показати локально

```powershell
npm run ci:local
npm run ci:fail
```

Перша команда має код 0: build → unit → API. Друга навмисно завершується кодом 1 на unit, після чого API пропускається. Це очікуваний failed scenario, не помилка налаштування.

Обидва сценарії однією перевіркою:

```powershell
npm run demo
```

Локальні HTML-звіти: `artifacts/success/index.html` та `artifacts/failed/index.html`. Поруч збережено logs, JSON і JUnit XML. Це локальне відтворення команд, окреме від справжніх GitHub Actions runs.

## Показати GitHub Actions

Відкрий [Actions](https://github.com/Stas0321/lab9/actions). Workflow: `.github/workflows/ci.yml`.

- `push` і `pull_request` запускають pipeline автоматично; workflow_dispatch доступний додатково.
- `build`: npm ci, перевірка синтаксису всіх файлів src, створення dist із кодом і міграціями, artifact build-output.
- `unit`: 14 тестів тарифу, страховки, валідації та повернення, artifact unit-reports.
- `api`: 5 тестів справжнього HTTP API з PostgreSQL 17 service container, artifact api-reports.
- `needs` утворює залежність build → unit → api.
- `if: always()` застосовано тільки до upload artifact; test failures не ігноруються. Немає continue-on-error або `|| true`.

Навмисна помилка для віддаленої демонстрації — `.ci/demo.json`: `forceFailure=true`. Один unit test тоді очікує 7001 коп. замість правильних 7000. Зміна false→true та push має дати failed pipeline; повернення false й push — green pipeline. Фінальний робочий стан має бути false. Посилання на реально виконані запуски буде зафіксовано у `GITHUB_RUNS.md`.

## Запуск на іншому ПК

Node.js 22+, PostgreSQL, `npm ci`. Скопіюй `.env.example` у `.env.local`, задай власні параметри БД. API tests створюють і видаляють лише власні схеми `lab9_*`. У GitHub Actions локальний файл не потрібний: параметри передаються з service container. Пароль у workflow — тестовий пароль тимчасового контейнера; це не локальні облікові дані.

`.env.local`, node_modules, dist, reports і artifacts не публікуються. Всі інші файли потрібні для незалежного відтворення.
