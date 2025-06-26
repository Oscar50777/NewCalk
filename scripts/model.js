// scripts/model.js

import * as Config from './config.js';

export function calculateItemsPerPage(printW, printH, itemW, itemH) {
  const W = itemW + 4;
  const H = itemH + 4;

  const v1 = Math.floor(printW / W) * Math.floor(printH / H);
  const v2 = Math.floor(printW / H) * Math.floor(printH / W);

  return Math.max(v1, v2);
}

export function calculatePaperCost({ sheet, quantity, N_opt, extraSheets = 250, density, paperType, customPrice }) {
  const baseSheets = Math.ceil(quantity / N_opt);
  const totalSheets = baseSheets + extraSheets;

  if (paperType === 'designer' || paperType === 'adhesive') {
    const sheetRatio = ['Z', 'E'].includes(sheet.name) ? 0.25 : 0.5;
    return customPrice * totalSheets * sheetRatio;
  }

  const areaSheet = (sheet.paperSize.w / 1000) * (sheet.paperSize.h / 1000);
  const weightSheet = areaSheet * (density / 1000);
  const pricePerKg = getPaperPriceByTypeAndDensity(paperType, density);

  return weightSheet * pricePerKg * totalSheets;
}

export function getPaperPriceByTypeAndDensity(paperType, density) {
  switch (paperType) {
    case 'offset': return 125;
    case 'matt': return density <= 200 ? 135 : 155;
    case 'cardboard': return 160;
    default: return 0;
  }
}
