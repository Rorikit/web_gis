import * as XLSX from 'xlsx';

export const createTableWorkbook = <T extends Record<string, unknown>>(rows: T[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Таблица');
  return workbook;
};
