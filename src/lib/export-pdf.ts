import { jsPDF } from 'jspdf';
import { areaAItems, type HistoricalScore, type Child } from '@/lib/seed';
import { ptSansBase64 } from './pt-sans-base64';

const SCORE_RGB: Record<number, [number, number, number]> = {
  0: [239, 239, 244],
  1: [255, 243, 205],
  2: [255, 224, 130],
  3: [165, 214, 167],
  4: [102, 187, 106],
};

export async function exportPdf(
  child: Child,
  historicalScores: HistoricalScore[],
  todayScores: Record<string, number> | null,
  todayDate: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Подключение кириллического шрифта
  doc.addFileToVFS('PTSans-Regular.ttf', ptSansBase64);
  doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
  doc.setFont('PTSans');

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // --- Заголовок ---
  doc.setFontSize(18);
  doc.setTextColor(36, 129, 204);
  doc.text('Отчёт ABLLS-R', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${child.firstName} ${child.lastInitial} · Область A — Сотрудничество`, margin, y);
  y += 5;
  doc.text(`Куратор: ${child.curator}`, margin, y);
  y += 5;
  doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, margin, y);
  y += 10;

  // --- Линия ---
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Таблица ---
  const dates = [...historicalScores.map((h) => h.date), todayDate];
  const allScoreSets = [...historicalScores.map((h) => h.scores), todayScores];

  const colWidths = {
    code: 10,
    name: 60,
    score: 18,
  };

  const tableW = colWidths.code + colWidths.name + colWidths.score * dates.length;
  const startX = margin;

  // Заголовок таблицы
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Код', startX + 1, y);
  doc.text('Навык', startX + colWidths.code + 1, y);
  dates.forEach((date, i) => {
    const x = startX + colWidths.code + colWidths.name + colWidths.score * i;
    doc.text(date, x + colWidths.score / 2, y, { align: 'center' });
  });
  y += 3;
  doc.line(startX, y, startX + tableW, y);
  y += 4;

  // Строки
  doc.setFontSize(7);
  for (const item of areaAItems) {
    doc.setTextColor(50, 50, 50);
    doc.text(item.code, startX + 1, y);

    // Обрезаем название, если слишком длинное
    const maxNameW = colWidths.name - 2;
    let name = item.name;
    while (doc.getTextWidth(name) > maxNameW && name.length > 10) {
      name = name.slice(0, -1);
    }
    if (name !== item.name) name += '…';
    doc.text(name, startX + colWidths.code + 1, y);

    // Баллы
    allScoreSets.forEach((scoreSet, colIdx) => {
      const score = scoreSet?.[item.code];
      const x = startX + colWidths.code + colWidths.name + colWidths.score * colIdx;

      if (score !== undefined) {
        const rgb = SCORE_RGB[score] || [255, 255, 255];
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(x + 2, y - 3, colWidths.score - 4, 5, 1, 1, 'F');
        doc.setTextColor(50, 50, 50);
        doc.text(String(score), x + colWidths.score / 2, y, { align: 'center' });
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('—', x + colWidths.score / 2, y, { align: 'center' });
      }
    });

    y += 7;
  }

  y += 5;

  // --- Динамика ---
  if (todayScores) {
    const lastHistorical = historicalScores[historicalScores.length - 1]?.scores || {};
    const improved: string[] = [];
    const declined: string[] = [];

    for (const item of areaAItems) {
      const prev = lastHistorical[item.code];
      const curr = todayScores[item.code];
      if (prev !== undefined && curr !== undefined) {
        if (curr > prev) improved.push(`${item.code}: ${prev} → ${curr}`);
        else if (curr < prev) declined.push(`${item.code}: ${prev} → ${curr}`);
      }
    }

    doc.setFontSize(11);
    doc.setTextColor(46, 125, 50);
    doc.text('Что выросло за период', margin, y);
    y += 6;

    doc.setFontSize(8);
    if (improved.length > 0) {
      improved.forEach((line) => {
        doc.setTextColor(46, 125, 50);
        doc.text(`↑ ${line}`, margin + 2, y);
        y += 4.5;
      });
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('Нет изменений вверх', margin + 2, y);
      y += 4.5;
    }

    if (declined.length > 0) {
      y += 3;
      doc.setFontSize(11);
      doc.setTextColor(230, 81, 0);
      doc.text('Что снизилось', margin, y);
      y += 6;

      doc.setFontSize(8);
      declined.forEach((line) => {
        doc.setTextColor(230, 81, 0);
        doc.text(`↓ ${line}`, margin + 2, y);
        y += 4.5;
      });
    }
  }

  // --- Комментарий куратора ---
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Комментарий куратора:', margin, y);
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 7;
  doc.line(margin, y, pageW - margin, y);
  y += 7;
  doc.line(margin, y, pageW - margin, y);

  // --- Файл ---
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  const filename = `ABLLS-R_${child.firstName}_${child.lastInitial}_${dateStr}.pdf`;

  doc.save(filename);
}
