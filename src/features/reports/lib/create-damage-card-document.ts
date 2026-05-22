import { Document, Paragraph, TextRun } from 'docx';
import type { Damage } from '@/entities';

export const createDamageCardDocument = (damage: Damage, additionalInfo: string) =>
  new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: `Карта повреждения ${damage.id}`, bold: true })] }),
          new Paragraph(`Адрес: ${damage.address}`),
          new Paragraph(`Описание: ${damage.damageDescription}`),
          new Paragraph(`Дополнительно: ${additionalInfo}`),
        ],
      },
    ],
  });
