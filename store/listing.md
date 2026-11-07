# Публикация в Chrome Web Store

Всё, что нужно для страницы расширения в магазине. Тексты ниже можно копировать
в [Developer Dashboard](https://chrome.google.com/webstore/devconsole) как есть.

## План публикации

### 1. Подготовить архив

1. Проверить версию: `version` в `public/manifest.json` (сейчас `1.0.0`) и
   `version` в `package.json` должны совпадать.
2. Собрать архив: `npm run package` →
   `release/contributor-stats-for-westend61-1.0.0.zip`. Внутри то же, что в
   `dist/`: `manifest.json` в корне архива, иконки, `_locales/en` и `_locales/ru`.
3. Последняя проверка: в `chrome://extensions` удалить установленную
   распакованную версию, нажать **Загрузить распакованное расширение**, выбрать
   свежую `dist/` и один раз полностью загрузить данные. Убедиться, что нет
   ошибок на карточке расширения.
4. Закоммитить всё и запушить в GitHub.

### 2. Выложить политику конфиденциальности

Магазин требует ссылку на политику. Файл — `store/privacy-policy.html`
(английский и русский на одной странице).

Самый простой способ — GitHub Pages в репозитории
`evakerrigan/westend61-statistics`:

1. GitHub → репозиторий → **Settings** → **Pages**.
2. **Source:** Deploy from a branch, **Branch:** `main`, папка `/ (root)` → **Save**.
3. Через 1–2 минуты политика будет по адресу
   `https://evakerrigan.github.io/westend61-statistics/store/privacy-policy.html`.
   Открыть ссылку и проверить, что страница видна.

GitHub Pages бесплатно работает только для публичного репозитория. Папки
`samples/` и `release/` в `.gitignore`, так что личных данных в репозитории нет.
Если репозиторий должен остаться закрытым — выложить политику туда же, где
политика Cavan (например, отдельной страницей Google Sites).

### 3. Создать карточку в Developer Dashboard

Аккаунт разработчика уже есть (через него опубликован Cavan), второй взнос
не нужен.

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) →
   **New item** → загрузить zip из `release/`.
2. Вкладка **Store listing** — тексты, категория и картинки из разделов ниже.
   Сначала английская версия, потом в списке языков вверху выбрать **Russian**
   и заполнить русскую (описание и русские скриншоты).
3. Вкладка **Privacy** — ответы из раздела «Конфиденциальность».
4. Вкладка **Distribution**:
   - **Visibility:** для начала удобно **Unlisted** (страница доступна только
     по ссылке — можно проверить на себе и дать знакомым фотографам), потом
     переключить на **Public**.
   - **Regions:** All regions.
   - **Payments:** Free.
5. Вкладка **Test instructions** (для проверяющих) — текст из раздела ниже.
6. **Submit for review**. Проверка обычно занимает от нескольких дней до пары
   недель. Расширения с доступом к сайтам (host permissions) проверяют
   внимательнее, поэтому важно, чтобы обоснования разрешений были понятными.

### 4. После проверки

- Если одобрят — придёт письмо, расширение появится по ссылке (Unlisted) или в
  поиске (Public). Ссылку можно добавить в README.
- Если отклонят — в письме будет причина и номер правила. Частые причины:
  непонятное обоснование разрешения, ссылка на политику не открывается,
  описание обещает то, чего нет. Исправить и отправить заново.

### 5. Обновления

1. Поднять `version` в `public/manifest.json` и `package.json` (например,
   `1.0.1`). Магазин не примет архив с той же версией.
2. `npm run package` → новый zip в `release/`.
3. Developer Dashboard → расширение → **Package** → **Upload new package** →
   **Submit for review**.
4. Если изменились картинки или тексты — обновить их на вкладке
   **Store listing** в той же отправке.

## Картинки

| Файл                                      | Куда                               |
| ----------------------------------------- | ---------------------------------- |
| `public/icons/westend-128.png`            | Store icon (128×128)               |
| `store/screenshots/01-overview.png`       | Screenshots (1280×800), по порядку |
| `store/screenshots/02-shoot-photos.png`   |                                    |
| `store/screenshots/03-monthly-charts.png` |                                    |
| `store/screenshots/04-dark-theme.png`     |                                    |
| `store/screenshots/05-mobile.png`         |                                    |
| `store/promo-small-440x280.png`           | Small promo tile (440×280)         |

Для русской версии страницы (**Localized screenshots**) — те же пять
скриншотов с русским интерфейсом в `store/screenshots/ru/`.

Все картинки — PNG без прозрачности (24-bit), как требует магазин.

На скриншотах — фото из твоего портфолио и названия твоих сабмишенов, суммы
продаж придуманы, партнёры обезличены (Stock1…Stock4).

## Store listing

**Name:** Contributor Stats for Westend61

**Category:** Productivity → Tools

**Language:** English (основной) и Russian. Русская версия страницы
появляется в списке языков вверху вкладки **Store listing** после загрузки
архива: в нём есть `_locales/ru` (название и краткое описание на русском —
в `public/_locales/ru/messages.json`).

**Русское название:** Статистика продаж для фотографов Westend61

### Summary

Берётся из описания в манифесте (`_locales/*/messages.json`, до 132 символов):

EN (121):

> Sales statistics for Westend61 photographers: earnings by photo, shoot, month and partner. Not affiliated with Westend61.

RU (112):

> Статистика продаж для фотографов Westend61: доход по фото, съёмкам, месяцам и партнёрам. Не связано с Westend61.

### Description — EN

```
See what every photo and every shoot actually earns you on Westend61.

Westend61 lists your licenses one by one. This extension collects all of them from your own photographer account and puts them together:

• By shoot — every submission as a shoot: revenue, sales, published and sold photos, revenue per photo, time on sale, split by partner agency. Open a shoot to see its sold photos, and the unsold ones in grey.
• By photo — every photo that sold, with search and sorting by any column.
• By month — revenue and number of sales per month, over the size of your portfolio, to see whether more photos mean more money.
• By upload year — how the shoots of each year keep selling as they get older.
• Portfolio overview — total earnings, sales, photos sold, portfolio success (share of photos that sold), average per sold photo and per portfolio photo, earnings by partner.

Photos are linked to shoots automatically from your submissions, in both the current and the previous submission system. You can join a shoot uploaded in several parts and group leftover photos into your own shoots.

English and Russian, light and dark theme, works on narrow screens.

Privacy: everything stays in your browser. The extension talks only to westend61.de using your existing login, has no servers and no tracking, and never sees your password. “Delete all data” removes everything.

How to use: log in at westend61.de as a photographer, click the extension icon, then “Load data”. The first load takes about a minute.

This is an independent project and is not affiliated with Westend61.
```

### Description — RU

```
Узнайте, сколько на самом деле приносит каждое фото и каждая съёмка на Westend61.

Westend61 показывает продажи списком, лицензия за лицензией. Расширение собирает их все из вашего аккаунта фотографа и сводит вместе:

• По съёмкам — каждый сабмишен как съёмка: доход, продажи, опубликованные и проданные фото, доход на одно фото, срок в продаже, разбивка по партнёрским агентствам. Внутри съёмки — проданные фото, а непроданные серым.
• По фото — все проданные фото с поиском и сортировкой по любой колонке.
• По месяцам — доход и число продаж по месяцам на фоне размера портфеля: видно, растёт ли доход вместе с портфелем.
• По годам загрузки — как продаются съёмки каждого года по мере того, как стареют.
• Общая статистика — весь доход, продажи, проданные фото, успешность портфеля (доля фото, которые продались), средний доход с проданного фото и на одно фото портфеля, доход по партнёрам.

Фото сами связываются со съёмками по вашим сабмишенам — и в новой, и в старой системе загрузки. Части одной фотосессии можно объединить, а оставшиеся фото собрать в свои съёмки.

Английский и русский язык, светлая и тёмная тема, удобно на узких экранах.

Конфиденциальность: всё остаётся в вашем браузере. Расширение обращается только к westend61.de через ваш уже выполненный вход, у него нет серверов и отслеживания, пароль оно не видит. Кнопка «Удалить все данные» стирает всё.

Как пользоваться: войдите на westend61.de как фотограф, нажмите на значок расширения, затем «Загрузить данные». Первая загрузка занимает около минуты.

Это независимый проект, он не связан с Westend61.
```

## Конфиденциальность (вкладка Privacy)

### Single purpose

> Shows a Westend61 photographer their own sales statistics — earnings by photo, by shoot, by month and by partner — collected from their logged-in Westend61 account.

### Permission justification

**storage:**

> Stores the downloaded sales statistics and the user's own settings (own shoots, joined shoots) locally, so the statistics are available without downloading everything again.

**unlimitedStorage:**

> Large portfolios (thousands of photos with full sales history) can exceed the default extension storage quota. The data stays on the user's device.

**scripting:**

> The extension runs requests inside the user's open westend61.de tab (and, for the submission pages, an ingestion.westend61.de / ingestionneo.westend61.de tab) so they use the user's existing Westend61 login, exactly like the Westend61 website itself. No code is injected into any other site.

**Host permissions `https://www.westend61.de/*`, `https://ingestion.westend61.de/*`, `https://ingestionneo.westend61.de/*`:**

> Westend61 is the only site the extension reads data from: the user's own earnings, dashboard and portfolio on www.westend61.de, and the user's own submissions on Westend61's two submission systems (ingestion.westend61.de — previous submissions, ingestionneo.westend61.de — current submissions). The submissions tell which photos belong to which shoot.

### Remote code

> No, I am not using remote code. (Весь код — в архиве; с Google Fonts загружается только шрифт, это не код.)

### Data usage

Расширение получает данные о продажах и доходе из аккаунта пользователя,
но хранит их только на устройстве и никуда не передаёт. Чтобы не было
вопросов на проверке, честнее отметить:

- [x] **Financial and payment information** — суммы продаж и доходов.
- [x] **Website content** — портфолио и сабмишены с westend61.de.

И все три подтверждения:

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** ссылка на опубликованный `store/privacy-policy.html`
(см. шаг 2 плана).

## Test instructions (для проверяющих)

```
The extension needs a Westend61 photographer account (www.westend61.de, photographer area) to load data; a regular customer account has no sales to show.

1. Log in at https://www.westend61.de as a photographer.
2. Click the extension icon — a tab with the statistics opens.
3. Click “Load data”. The extension loads the photographer's earnings, dashboard, portfolio and submissions one request at a time (about a minute), then shows the statistics.

Without a photographer account, the page shows the empty state and the error “Westend61 returned no data. Make sure you are logged in at westend61.de as a photographer.” The store screenshots show the interface with demo data.
```
