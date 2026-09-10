# ABLLS-R Диагностика — Telegram Mini App (Демо)

Демо Telegram Mini App для ABA-клиники: диагностика ребёнка по протоколу ABLLS-R.  
Терапевт выбирает ребёнка, проходит по 12 пунктам области A, ставит баллы — и получает матрицу динамики + скачиваемые Excel и PDF.

## Стек

- **Next.js 16** (App Router, TypeScript strict)
- **Tailwind CSS v4**
- **Telegram Web App SDK** (`@twa-dev/sdk`)
- **SheetJS** (`xlsx`) — экспорт Excel
- **jsPDF** + шрифт PT Sans — экспорт PDF с кириллицей
- **localStorage** — вместо бэкенда. Данные живут только на устройстве

## Подключение к Telegram-боту

### Шаг 1. Создайте бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Введите имя бота, например: `ABLLS-R Demo`
4. Введите username бота, например: `ablls_demo_bot`
5. Сохраните токен (он не понадобится для демо, но пригодится позже)

### Шаг 2. Подключите Mini App

**Вариант A — через Menu Button (кнопка в чате с ботом):**

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots` → выберите вашего бота
3. Выберите **Bot Settings** → **Menu Button**
4. Выберите **Configure Menu Button**
5. Введите текст кнопки: `Открыть`
6. Введите URL: `https://ваш-домен.vercel.app`

**Вариант B — через Web App (`/newapp`):**

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newapp`
3. Выберите вашего бота
4. Отправьте название: `ABLLS-R Диагностика`
5. Отправьте описание: `Демо системы диагностики по протоколу ABLLS-R`
6. Отправьте картинку (любую, 640x360 или больше)
7. Отправьте GIF (или отправьте `/empty`)
8. Введите URL: `https://ваш-домен.vercel.app`
9. Введите short_name: `ablls`

### Шаг 3. Протестируйте

Откройте чат с ботом → нажмите кнопку меню → приложение откроется внутри Telegram.

## Сброс демо-данных

Чтобы начать демо заново (сбросить все баллы, заставку, прогресс):

**В браузере:**
1. Откройте DevTools (F12) → Console
2. Выполните:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('ablls_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

**В Telegram:**
Закройте Mini App → Очистите данные через настройки Telegram → Откройте заново.

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Деплой на Vercel

```bash
npm install -g vercel
vercel --prod
```

Или привяжите репозиторий к Vercel через [vercel.com/new](https://vercel.com/new).

## Что в демо

- ✅ Заставка с описанием
- ✅ Список детей с поиском и прогрессом
- ✅ Карточка ребёнка с областями и историей
- ✅ Простановка баллов (12 пунктов области A)
- ✅ Автосохранение в localStorage
- ✅ Восстановление позиции при перезапуске
- ✅ Предупреждение при снижении балла с обязательной причиной
- ✅ Матрица срезов с цветовой кодировкой
- ✅ Экспорт в Excel (SheetJS)
- ✅ Экспорт в PDF с кириллицей (jsPDF + PT Sans)
- ✅ Telegram BackButton, MainButton, HapticFeedback
- ✅ Фоллбэк для обычного браузера
- ✅ Панель руководителя (/dashboard)

## Что не реализовано

- Области B, C, D (только заглушка)
- Редактирование/создание карточки ребёнка
- Авторизация и роли
- База данных
- Тесты
