# ЛР9 — справжні запуски GitHub Actions

Це фактичні автоматичні push-triggered runs у репозиторії Stas0321/lab9, не локальна імітація.

| Сценарій | Результат | Jobs | Відкрити |
|---|---|---|---|
| Початковий робочий стан, commit fe9de4f | SUCCESS | build success → unit success → api success | [Run 42598507297](https://github.com/Stas0321/lab9/actions/runs/42598507297) |
| Навмисне неправильне очікування, commit 48cff86 | FAILURE | build success → unit failure → api skipped | [Run 42598754427](https://github.com/Stas0321/lab9/actions/runs/42598754427) |

У невдалому commit єдина зміна — `.ci/demo.json`: forceFailure=true. Тест DEMO очікує 7001 коп., тоді як calculateBaseFee(1000,100) правильно повертає 7000. Тому unit job має ненульовий exit code, весь pipeline — failure, наступний api job — skipped. Звіти зберігаються попри падіння.

Артефакти успішного run: build-output, unit-reports, api-reports. Артефакти failed run: build-output та unit-reports. Відкрий відповідний Actions run і секцію Artifacts; у unit-reports є unit.json і unit.junit.xml. Для завантаження GitHub може вимагати вхід у твій обліковий запис.

Метадані jobs, steps і artifacts збережено у `evidence/run-42598507297.json` та `evidence/run-42598754427.json`.

Після демонстрації forceFailure повернуто в false. Поточний робочий стан та нові автоматичні runs дивись у [списку Actions](https://github.com/Stas0321/lab9/actions). Повторити навмисний збій локально без зміни робочого стану: `npm run ci:fail`.
