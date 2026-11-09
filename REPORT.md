# Звіт до лабораторної №9

Мета — автоматизувати збирання і тестування SUT B після змін у репозиторії та зберігати діагностику результатів. Використано GitHub Actions і JavaScript SUT B доставки посилок, підгрупа 2, варіант 08.

## Структура

Подія push або pull_request → build → unit → api. Кожен job має власний Ubuntu runner, checkout і npm ci з package-lock.json. Build для цього JavaScript-проєкту перевіряє синтаксис і готує dist з кодом та SQL; тут немає TypeScript або іншої компіляції. Unit tests перевіряють чисті обчислення без БД. API tests запускають Express через HTTP і перевіряють фактичні записи PostgreSQL; головний API не підмінено mock.

У workflow PostgreSQL 17-alpine запускається як service container, готовність контролюється pg_isready. Кожен API test додатково створює власну схему з міграцією та видаляє її після завершення.

## Звіти й помилки

Збережено build manifest, Jest JSON і JUnit XML. Upload artifacts виконується з if: always(), тому невдалий unit job також надає звіт. Ненульовий код процесу тестування залишається ненульовим; наступний job пропускається через needs.

Локально виконано обидва сценарії через `npm run demo`: успішний завершується 0; навмисний збій — 1, unit FAIL, API skipped. У failed unit report видно Expected: 7001, Received: 7000. Причина — навмисно неправильне очікування у тесті DEMO; бізнес-формулу не змінено. Сирі локальні докази збережено в artifacts/success і artifacts/failed. Локальні запуски не видаються за GitHub Actions; справжні посилання та статуси записуються окремо у GITHUB_RUNS.md.

## Для захисту

1. Відкрити `.github/workflows/ci.yml`, показати triggers і needs.
2. Відкрити успішний Actions run, показати три jobs і artifacts.
3. Відкрити failed run, показати червоний unit та пропущений API.
4. Відкрити log / unit.junit.xml, пояснити 7001 проти 7000.
5. Показати відновлений зелений стан після повернення forceFailure=false.
6. За потреби виконати `npm run ci:local` або `npm run ci:fail` локально.

CI — регулярна інтеграція змін з автоматичною перевіркою. Pipeline — весь процес; job — окремий етап; trigger — подія запуску; runner — машина, яка виконує commands; artifact — збережені файли результату. У цій роботі немає deployment: завдання присвячене CI та continuous testing.
