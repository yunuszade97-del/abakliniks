import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelegramProvider } from "@/components/TelegramProvider";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "ABLLS-R Диагностика",
  description: "Система диагностики по протоколу ABLLS-R для ABA-терапии",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" defer />
      </head>
      <body className="min-h-full flex flex-col">
        <TelegramProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
