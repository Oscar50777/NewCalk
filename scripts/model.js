// scripts/model.js

import * as Config from './config.js';

/**
 * Возвращает количество изделий на одном печатном листе
 */
export function calculateItemsPerPage(printW, printH, itemW, itemH) {
  const W = itemW + 4;
  const H = itemH + 4;

  const v1 = Math.floor(printW / W) * Math.floor(printH / H);
  const v2 = Math.floor(printW / H) * Math.floor(printH / W);

  return Math.max(v1, v2);
}

/**
 * Рассчитывает стоимость бумаги
 */
export function calculatePaperCost({
  sheet,
  quantity,
  N_opt,
  extraSheets = 250,
  density,
  paperType,
  customPrice
}) {
  const baseSheets = Math.ceil(quantity / N_opt);
  const totalSheets = baseSheets + extraSheets;

  if (paperType === 'designer' || paperType === 'adhesive') {
    const sheetRatio = ['Z', 'E'].includes(sheet.name) ? 0.25 : 0.5;
    return customPrice * totalSheets * sheetRatio;
  }

  const areaSheet = (sheet.paperSize.w / 1000) * (sheet.paperSize.h / 1000);
  const weightSheet = areaSheet * (density / 1000);
  const pricePerKg = typeof Config.PAPER_PRICE_RULES[paperType] === 'function'
    ? Config.PAPER_PRICE_RULES[paperType](density)
    : Config.PAPER_PRICE_RULES[paperType];

  return weightSheet * pricePerKg * totalSheets;
}

/**
 * Рассчитывает стоимость печати
 */
export function calculatePrintCost({ sheet, totalSheets, sides, printCostZ, printCostE, printCostOffset }) {
  let costPerSheet;
  switch (sheet.name) {
    case 'Z':
      costPerSheet = printCostZ;
      break;
    case 'E':
      costPerSheet = printCostE;
      break;
    default:
      costPerSheet = printCostOffset;
  }

  return costPerSheet * totalSheets * sides;
}

/**
 * Рассчитывает стоимость приладки печати
 */
export function calculatePrintSetup({ sheet, setupZ, setupE, setupOffset }) {
  switch (sheet.name) {
    case 'Z':
      return setupZ;
    case 'E':
      return setupE;
    default:
      return setupOffset;
  }
}

/**
 * Рассчитывает стоимость резки
 */
export function calculateCuttingCost({ enabled, totalSheets, cost = 1, setup = 300 }) {
  return enabled ? cost * totalSheets + setup : 0;
}

/**
 * Рассчитывает стоимость ламинации
 */
export function calculateLaminationCost({ enabled, totalSheets, cost = 12, setup = 300, sides = "1+0" }) {
  return enabled ? cost * totalSheets * (sides === "1+1" ? 2 : 1) + setup : 0;
}

/**
 * Рассчитывает стоимость биговки
 */
export function calculateScoreCost({ enabled, quantity, count, cost = 2, setup = 300 }) {
  return enabled ? quantity * count * cost + setup : 0;
}

/**
 * Рассчитывает стоимость фальцовки
 */
export function calculateFoldingCost({ enabled, quantity, cost = 1, setup = 300 }) {
  return enabled ? quantity * cost + setup : 0;
}

/**
 * Рассчитывает стоимость вырубки
 */
export function calculateDiecutCost({ enabled, quantity, cost = 5, setup = 5000, stampCost = 5500 }) {
  return enabled ? quantity * cost + setup + stampCost : 0;
}

/**
 * Рассчитывает стоимость УФ-лакировки
 */
export function calculateUvLacquerCost({ enabled, totalSheets, cost = 10, setup = 5000 }) {
  return enabled ? cost * totalSheets + setup : 0;
}

/**
 * Рассчитывает стоимость тиснения
 */
export function calculateEmbossingCost({ enabled, quantity, cost = 10, setup = 4500, klischeCost = 2000 }) {
  return enabled ? quantity * cost + setup + klischeCost : 0;
}

/**
 * Рассчитывает стоимость сборки
 */
export function calculateAssemblyCost({ enabled, quantity, cost = 5, setup = 300 }) {
  return enabled ? quantity * cost + setup : 0;
}

/**
 * Рассчитывает общую себестоимость
 */
export function calculateTotalCost(...costs) {
  return costs.reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);
}

/**
 * Применяет множитель к стоимости
 */
export function applyMultiplier(cost, multiplier = 1) {
  return cost * multiplier;
}

/**
 * Округляет до десятков
 */
export function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

/**
 * Возвращает цену бумаги по типу и плотности
 */
export function getPaperPriceByTypeAndDensity(paperType, density) {
  if (paperType === "offset") return 125;
  if (paperType === "matt") return density <= 200 ? 135 : 155;
  if (paperType === "cardboard") return 160;
  return 0;
}

/**
 * Возвращает метку типа бумаги
 */
export function getPaperTypeLabel(type) {
  return type === "offset" ? "Офсетная" :
         type === "matt" ? "Мелованная" :
         type === "cardboard" ? "Картон" :
         type === "designer" ? "Дизайнерская" :
         type === "adhesive" ? "Самоклейка" : type;
}

/**
 * Рассчитывает стоимость для одного формата листа
 */
export function calculateForSheetFormat(
  sheet,
  width,
  height,
  quantity,
  density,
  paperType,
  customPaperPrice,
  s,
  printCostZ,
  printCostE,
  printCostOffset,
  setupPrintZ,
  setupPrintE,
  setupPrintOffset,
  cuttingEnabled,
  cuttingCost,
  setupCutting,
  laminationEnabled,
  laminationCost,
  setupLamination,
  laminationSides,
  scoreEnabled,
  scoreCount,
  scoreCost,
  setupScore,
  foldingEnabled,
  foldingCost,
  setupFolding,
  diecutEnabled,
  diecutCost,
  setupDiecut,
  diecutStampCost,
  uvLacquerEnabled,
  uvLacquerCost,
  setupUvLacquer,
  embossingEnabled,
  embossingCost,
  setupEmbossing,
  embossingKlischeCost,
  assemblyEnabled,
  assemblyCost,
  setupAssembly
) {
  const W = width + 4;
  const H = height + 4;
  const printW = sheet.printArea.w;
  const printH = sheet.printArea.h;

  const N_opt = calculateItemsPerPage(printW, printH, W, H);
  const baseSheets = quantity > 0 ? Math.ceil(quantity / N_opt) : 0;
  const extraSheets = ["Z", "E"].includes(sheet.name) ? 3 : 250;
  const totalSheets = baseSheets + extraSheets;

  const paperTotal = calculatePaperCost({
    sheet,
    quantity,
    N_opt,
    extraSheets,
    density,
    paperType,
    customPrice: customPaperPrice
  });

  const printCostPerSheet = sheet.name === "Z"
    ? printCostZ
    : sheet.name === "E"
      ? printCostE
      : printCostOffset;

  const setupPrintValue = sheet.name === "Z"
    ? setupPrintZ
    : sheet.name === "E"
      ? setupPrintE
      : setupPrintOffset;

  const printTotal = calculatePrintCost({
    sheet,
    totalSheets,
    sides: s,
    printCostZ,
    printCostE,
    printCostOffset
  }) + setupPrintValue;

  const cuttingTotal = calculateCuttingCost({
    enabled: cuttingEnabled,
    totalSheets,
    cost: cuttingCost,
    setup: setupCutting
  });

  const laminationTotal = calculateLaminationCost({
    enabled: laminationEnabled,
    totalSheets,
    cost: laminationCost,
    setup: setupLamination,
    sides: laminationSides
  });

  const scoreTotal = calculateScoreCost({
    enabled: scoreEnabled,
    quantity,
    count: scoreCount,
    cost: scoreCost,
    setup: setupScore
  });

  const foldingTotal = calculateFoldingCost({
    enabled: foldingEnabled,
    quantity,
    cost: foldingCost,
    setup: setupFolding
  });

  const diecutTotal = calculateDiecutCost({
    enabled: diecutEnabled,
    quantity,
    cost: diecutCost,
    setup: setupDiecut,
    stampCost: diecutStampCost
  });

  const uvLacquerTotal = calculateUvLacquerCost({
    enabled: uvLacquerEnabled,
    totalSheets,
    cost: uvLacquerCost,
    setup: setupUvLacquer
  });

  const embossingTotal = calculateEmbossingCost({
    enabled: embossingEnabled,
    quantity,
    cost: embossingCost,
    setup: setupEmbossing,
    klischeCost: embossingKlischeCost
  });

  const assemblyTotal = calculateAssemblyCost({
    enabled: assemblyEnabled,
    quantity,
    cost: assemblyCost,
    setup: setupAssembly
  });

  const total = calculateTotalCost(
    paperTotal,
    printTotal,
    cuttingTotal,
    laminationTotal,
    scoreTotal,
    foldingTotal,
    diecutTotal,
    uvLacquerTotal,
    embossingTotal,
    assemblyTotal
  );

  const roundedTotal = roundToNearestTen(total);

  return {
    format: sheet.name,
    N_opt,
    totalSheets,
    paperTotal,
    printTotal,
    cuttingTotal,
    laminationTotal,
    scoreTotal,
    foldingTotal,
    diecutTotal,
    uvLacquerTotal,
    embossingTotal,
    assemblyTotal,
    total,
    roundedTotal
  };
}
