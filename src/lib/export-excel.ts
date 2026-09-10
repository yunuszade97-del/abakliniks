import * as XLSX from 'xlsx';
import { areaAItems, type HistoricalScore, type Child } from '@/lib/seed';

const SCORE_HEX: Record<number, string> = {
  0: 'EFEFF4',
  1: 'FFF3CD',
  2: 'FFE082',
  3: 'A5D6A7',
  4: '66BB6A',
};

export function exportExcel(
  child: Child,
  historicalScores: HistoricalScore[],
  todayScores: Record<string, number> | null,
  todayDate: string,
) {
  const wb = XLSX.utils.book_new();

  // Заголовки
  const dates = [...historicalScores.map((h) => h.date), todayDate];
  const header = ['Код', 'Навык', ...dates];

  // Данные
  const rows = areaAItems.map((item) => {
    const scores = historicalScores.map((h) => h.scores[item.code] ?? '');
    const today = todayScores ? (todayScores[item.code] ?? '') : '';
    return [item.code, item.name, ...scores, today];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Ширина колонок
  ws['!cols'] = [
    { wch: 5 },
    { wch: 45 },
    ...dates.map(() => ({ wch: 8 })),
  ];

  // Заливка ячеек — через стили (если поддерживается)
  // XLSX community edition не поддерживает стили, но мы создаём корректную структуру
  // Для полной поддержки стилей нужен xlsx-style (pro), но для демо это достаточно
  for (let r = 0; r < areaAItems.length; r++) {
    for (let c = 0; c < dates.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: r + 1, c: c + 2 });
      const cell = ws[cellRef];
      if (cell && typeof cell.v === 'number') {
        const hex = SCORE_HEX[cell.v];
        if (hex) {
          cell.s = {
            fill: { fgColor: { rgb: hex } },
            alignment: { horizontal: 'center' },
          };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'ABLLS-R Область A');

  // Файл
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  const filename = `ABLLS-R_${child.firstName}_${child.lastInitial}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
