import { NextRequest, NextResponse } from 'next/server';

// Минимальные типы update'а Telegram — ровно те поля, что реально используются.
type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number };
  };
};

const TELEGRAM_API = 'https://api.telegram.org';

// Приветственное сообщение и клавиатура с кнопкой web_app для команды /start.
async function sendStartMessage(chatId: number) {
  const botToken = process.env.BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://abakliniks.vercel.app';

  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: 'Это демо-версия системы диагностики ABLLS-R для АВА-центра. Все данные тестовые.',
      reply_markup: {
        inline_keyboard: [[{ text: 'Открыть приложение', web_app: { url: appUrl } }]],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`sendMessage failed: ${res.status} ${await res.text()}`);
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    // Без секрета проверку подлинности выполнить нельзя — обрабатывать запрос нельзя.
    return NextResponse.json({ error: 'TELEGRAM_WEBHOOK_SECRET не задан' }, { status: 500 });
  }
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const update: TelegramUpdate = await request.json();

  if (update.message?.text?.startsWith('/start')) {
    try {
      await sendStartMessage(update.message.chat.id);
    } catch (error) {
      // Telegram будет ретраить update, если ответить не 200 — поэтому только логируем.
      console.error('Не удалось отправить ответ на /start:', error);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
