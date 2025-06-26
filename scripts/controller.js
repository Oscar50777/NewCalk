// scripts/controller.js

import * as Model from './model.js';
import * as View from './view.js';

let s = 1; // Цветность: 4+0 или 4+4
let selectedProductType = "";
let savedResults = [];

/**
 * Инициализация всех событий при загрузке страницы
 */
export function initEventListeners() {
  // Цветность
  document.getElementById("btn_4_0").addEventListener("click", () => setSides(1));
  document.getElementById("btn_4_4").addEventListener("click", () => setSides(2));

  // Размер изделия
  document.getElementById("width").addEventListener("input", onInputChange);
  document.getElementById("height").addEventListener("input", onInputChange);

  // Тираж
  document.getElementById("quantity").addEventListener("input", onInputChange);

  // Тип бумаги
  document.getElementById("paperType").addEventListener("change", handlePaperTypeChange);

  // Пользовательская цена бумаги
  document.getElementById("customPaperPrice").addEventListener("input", onInputChange);

  // Настройки печати
  const printSettings = ["printCostZ", "setupPrintZ", "printCostE", "setupPrintE", "printCostOffsetA2", "setupPrintOffsetA2"];
  printSettings.forEach(id => {
    document.getElementById(id).addEventListener("input", onInputChange);
  });

  // Послепечатные работы — чекбоксы
  const postpressCheckboxes = [
    "laminationEnabled",
    "scoreEnabled",
    "foldingEnabled",
    "diecutEnabled",
    "uvLacquerEnabled",
    "embossingEnabled",
    "assemblyEnabled",
    "cuttingEnabled"
  ];
  postpressCheckboxes.forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateSubFields);
  });

  // Ламинация - радио-кнопки
  document.querySelectorAll('input[name="laminationSides"]').forEach(radio => {
    radio.addEventListener("change", onInputChange);
  });

  // Подполя постпечати
  const subFieldInputs = [
    "scoreCountInput",
    "scoreCost",
    "setupScore",
    "foldingCostSetting",
    "setupFolding",
    "diecutCostSetting",
    "setupDiecut",
    "diecutStampCostSetting",
    "uvLacquerCostSetting",
    "setupUvLacquer",
    "embossingCostSetting",
    "setupEmbossing",
    "embossingKlischeCostSetting",
    "assemblyCostSetting",
    "setupAssembly",
    "cuttingCostSetting",
    "setupCutting",
    "laminationCost",
    "setupLamination"
  ];

  subFieldInputs.forEach(id => {
    document.getElementById(id)?.addEventListener("input", onInputChange);
  });

  // Множитель количества
  document.getElementById("quantityMultiplier")?.addEventListener("input", onMultiplierChange);
  document.querySelector(".multiplier-control button[onclick*='-']")?.addEventListener("click", () => changeMultiplier(-1));
  document.querySelector(".multiplier-control button[onclick*='+']")?.addEventListener("click", () => changeMultiplier(1));

  // Брошюра
  document.getElementById("brochureInput")?.addEventListener("input", calculateBrochureResult);

  // Кнопки форматов
  document.querySelectorAll("#formatButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
      const sizeStr = btn.textContent.trim().match(/(\d+)×(\d+)/)?.[0];
      if (sizeStr) {
        const [w, h] = sizeStr.split("×").map(Number);
        document.getElementById("width").value = w;
        document.getElementById("height").value = h;
        View.updateFormatButtons();
        onInputChange();
      }
    });
  });

  // Кнопки тиража
  document.querySelectorAll("#quantityButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
      const qty = parseInt(btn.dataset.qty || btn.textContent.replace(/\D+/g, ""), 10);
      document.getElementById("quantity").value = qty;
      document.querySelectorAll("#quantityButtons button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      onInputChange();
    });
  });

  // Кнопки типов продукции
  document.querySelectorAll("#productTypeButtons button").forEach(btn => {
    btn.addEventListener("click", () => selectProductType(btn));
  });

  // Кнопка "Прайс-лист"
  document.querySelector("#productTypeButtons button:last-child")?.addEventListener("click", generatePriceListByFormatsWithSellingPrice);

  // Кнопка копирования
  document.querySelector("button[onclick='copyToClipboard()']")?.addEventListener("click", () => copyToClipboard(savedResults));

  // Первый запуск
  window.addEventListener("load", () => {
    View.updatePaperOptions();
    View.updateFormatButtons();
    View.addQuantityButtons();
    onInputChange();
  });
}

/**
 * Обработчик изменения типа бумаги
 */
function handlePaperTypeChange(e) {
  const paperType = e.target.value;
  const isCustom = paperType === "designer" || paperType === "adhesive";
  document.getElementById("customPaperPriceContainer").style.display = isCustom ? "block" : "none";
  View.updatePaperOptions(paperType);
  onInputChange();
}

/**
 * Обработчик изменения цветности
 */
export function setSides(val) {
  s = val;
  document.querySelectorAll(".side-buttons button").forEach(btn => btn.classList.remove("selected"));
  if (val === 1) {
    document.getElementById("btn_4_0").classList.add("selected");
  } else {
    document.getElementById("btn_4_4").classList.add("selected");
  }
  onInputChange();
}

/**
 * Обновление видимости подполей постпечати
 */
export function updateSubFields() {
  View.updateSubFieldsVisibility();
  onInputChange();
}

/**
 * Основная функция расчёта
 */
export function onInputChange() {
  calculate();
  View.renderSavedList(savedResults, getMarkupPercent());
}

/**
 * Расчёт себестоимости
 */
function calculate() {
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";

  const w = parseFloat(document.getElementById("width").value) || 0;
  const h = parseFloat(document.getElementById("height").value) || 0;
  const N = parseInt(document.getElementById("quantity").value) || 0;
  const density = parseInt(document.getElementById("densityInput").value) || 0;
  const paperType = document.getElementById("paperType").value;
  const isCustomPaper = paperType === "designer" || paperType === "adhesive";
  const customPaperPrice = isCustomPaper ? parseFloat(document.getElementById("customPaperPrice").value) || 0 : 0;

  const c_p_Z = parseFloat(document.getElementById("printCostZ").value) || 0;
  const P_Z = parseFloat(document.getElementById("setupPrintZ").value) || 0;
  const c_p_E = parseFloat(document.getElementById("printCostE").value) || 0;
  const P_E = parseFloat(document.getElementById("setupPrintE").value) || 0;
  const c_p_Offset = parseFloat(document.getElementById("printCostOffsetA2").value) || 0;
  const P_Offset = parseFloat(document.getElementById("setupPrintOffsetA2").value) || 0;

  const cuttingEnabled = document.getElementById("cuttingEnabled")?.checked ?? false;
  const cuttingCost = parseFloat(document.getElementById("cuttingCostSetting").value) || 0;
  const setupCutting = parseFloat(document.getElementById("setupCutting").value) || 0;

  const laminationEnabled = document.getElementById("laminationEnabled")?.checked ?? false;
  const laminationCost = parseFloat(document.getElementById("laminationCost").value) || 0;
  const setupLamination = parseFloat(document.getElementById("setupLamination").value) || 0;
  const laminationSides = document.querySelector('input[name="laminationSides"]:checked')?.value ?? "1+0";

  const scoreEnabled = document.getElementById("scoreEnabled")?.checked ?? false;
  const scoreCost = parseFloat(document.getElementById("scoreCost").value) || 0;
  const setupScore = parseFloat(document.getElementById("setupScore").value) || 0;
  const scoreCount = parseFloat(document.getElementById("scoreCountInput").value) || 0;

  const foldingEnabled = document.getElementById("foldingEnabled")?.checked ?? false;
  const foldingCost = parseFloat(document.getElementById("foldingCostSetting").value) || 0;
  const setupFolding = parseFloat(document.getElementById("setupFolding").value) || 0;

  const diecutEnabled = document.getElementById("diecutEnabled")?.checked ?? false;
  const diecutCost = parseFloat(document.getElementById("diecutCostSetting").value) || 0;
  const setupDiecut = parseFloat(document.getElementById("setupDiecut").value) || 0;
  const diecutStampCost = parseFloat(document.getElementById("diecutStampCostSetting").value) || 0;

  const uvLacquerEnabled = document.getElementById("uvLacquerEnabled")?.checked ?? false;
  const uvLacquerCost = parseFloat(document.getElementById("uvLacquerCostSetting").value) || 0;
  const setupUvLacquer = parseFloat(document.getElementById("setupUvLacquer").value) || 0;

  const embossingEnabled = document.getElementById("embossingEnabled")?.checked ?? false;
  const embossingCost = parseFloat(document.getElementById("embossingCostSetting").value) || 0;
  const setupEmbossing = parseFloat(document.getElementById("setupEmbossing").value) || 0;
  const embossingKlischeCost = parseFloat(document.getElementById("embossingKlischeCostSetting").value) || 0;

  const assemblyEnabled = document.getElementById("assemblyEnabled")?.checked ?? false;
  const assemblyCost = parseFloat(document.getElementById("assemblyCostSetting").value) || 0;
  const setupAssembly = parseFloat(document.getElementById("setupAssembly").value) || 0;

  const multiplier = parseFloat(document.getElementById("quantityMultiplier").value) || 1;

  const results = Config.SHEET_FORMATS.map(sheet => {
    const W = w + 4;
    const H = h + 4;
    const printW = sheet.printArea.w;
    const printH = sheet.printArea.h;

    const v1 = Math.floor(printW / W) * Math.floor(printH / H);
    const v2 = Math.floor(printW / H) * Math.floor(printH / W);
    const N_opt = Math.max(v1, v2);

    const baseSheets = N > 0 ? Math.ceil(N / N_opt) : 0;
    const extraSheets = ["Z", "E"].includes(sheet.name) ? 3 : 250;
    const totalSheets = baseSheets + extraSheets;

    const paperTotal = Model.calculatePaperCost({
      sheet,
      quantity: N,
      N_opt,
      extraSheets,
      density,
      paperType,
      customPrice: customPaperPrice
    });

    const printTotal = Model.calculatePrintCost({
      sheet,
      totalSheets,
      sides: s,
      printCostZ: c_p_Z,
      printCostE: c_p_E,
      printCostOffset: c_p_Offset
    }) + Model.calculatePrintSetup({
      sheet,
      setupZ: P_Z,
      setupE: P_E,
      setupOffset: P_Offset
    });

    const cuttingTotal = Model.calculateCuttingCost({ enabled: cuttingEnabled, totalSheets, cost: cuttingCost, setup: setupCutting });
    const laminationTotal = Model.calculateLaminationCost({ enabled: laminationEnabled, totalSheets, cost: laminationCost, setup: setupLamination, sides: laminationSides });
    const scoreTotal = Model.calculateScoreCost({ enabled: scoreEnabled, quantity: N, count: scoreCount, cost: scoreCost, setup: setupScore });
    const foldingTotal = Model.calculateFoldingCost({ enabled: foldingEnabled, quantity: N, cost: foldingCost, setup: setupFolding });
    const diecutTotal = Model.calculateDiecutCost({ enabled: diecutEnabled, quantity: N, cost: diecutCost, setup: setupDiecut, stampCost: diecutStampCost });
    const uvLacquerTotal = Model.calculateUvLacquerCost({ enabled: uvLacquerEnabled, totalSheets, cost: uvLacquerCost, setup: setupUvLacquer });
    const embossingTotal = Model.calculateEmbossingCost({ enabled: embossingEnabled, quantity: N, cost: embossingCost, setup: setupEmbossing, klischeCost: embossingKlischeCost });
    const assemblyTotal = Model.calculateAssemblyCost({ enabled: assemblyEnabled, quantity: N, cost: assemblyCost, setup: setupAssembly });

    const total = Model.calculateTotalCost(
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

    const roundedTotal = Model.roundToNearestTen(total);
    const finalTotal = roundedTotal * multiplier;

    return {
      format: sheet.name,
      productSize: `${w}×${h}`,
      color: s === 1 ? "4+0" : "4+4",
      N_opt,
      totalSheets,
      paperTotal,
      printTotal,
      cuttingEnabled,
      cuttingTotal,
      laminationEnabled,
      laminationTotal,
      laminationSides,
      scoreEnabled,
      scoreTotal,
      scoreCount,
      foldingEnabled,
      foldingTotal,
      diecutEnabled,
      diecutTotal,
      uvLacquerEnabled,
      uvLacquerTotal,
      embossingEnabled,
      embossingTotal,
      assemblyEnabled,
      assemblyTotal,
      cost: roundedTotal,
      total: finalTotal,
      multiplier
    };
  });

  const markupPercent = getMarkupPercent();

  View.renderResultsTable(results, markupPercent);
}

/**
 * Запоминание результата
 */
export function rememberResult(
  format, productSize, color, paperType, density, quantity, cost,
  cuttingEnabled, laminationEnabled, laminationSides,
  scoreEnabled, foldingEnabled, diecutEnabled, uvLacquerEnabled, embossingEnabled, assemblyEnabled
) {
  const multiplier = parseFloat(document.getElementById("quantityMultiplier").value) || 1;
  const finalCost = cost * multiplier;
  const key = JSON.stringify({ format, productSize, color, paperType, density, quantity, cost: finalCost, multiplier });

  if (savedResults.some(r => JSON.stringify({
    format: r.format,
    productSize: r.productSize,
    color: r.color,
    paperType: r.paperType,
    density: r.density,
    quantity: r.quantity,
    cost: r.cost,
    multiplier: r.multiplier || 1
  }) === key)) {
    alert("❗ Такой вариант уже сохранён.");
    return;
  }

  const customPaperPrice = (paperType === "designer" || paperType === "adhesive")
    ? parseFloat(document.getElementById("customPaperPrice").value) || 0
    : 0;

  savedResults.push({
    format, productSize, color, paperType, density, quantity,
    cost: finalCost,
    originalCost: cost,
    multiplier,
    productType: selectedProductType,
    cuttingEnabled, laminationEnabled, laminationSides,
    scoreEnabled, foldingEnabled, diecutEnabled, uvLacquerEnabled, embossingEnabled, assemblyEnabled,
    priceOverride: null,
    customPaperPrice
  });

  View.renderSavedList(savedResults, getMarkupPercent());
}

/**
 * Получить наценку из поля
 */
function getMarkupPercent() {
  return parseFloat(document.getElementById("markupPercent").value) || 20;
}

/**
 * Выбор типа продукции (визитки, буклеты и т.д.)
 */
export function selectProductType(buttonElement) {
  document.querySelectorAll("#productTypeButtons button").forEach(btn => btn.classList.remove("selected"));
  buttonElement.classList.add("selected");
  selectedProductType = buttonElement.getAttribute("data-type");

  if (selectedProductType === "Пакет А4") {
    View.setFormat("420×594");
    document.getElementById("paperType").value = "matt";
    View.updatePaperOptions();
    document.getElementById("densityInput").value = 200;
    document.getElementById("laminationEnabled").checked = true;
    document.getElementById("laminationSides").checked = true;
    document.getElementById("diecutEnabled").checked = true;
    document.getElementById("diecutStampCostSetting").value = 0;
    document.getElementById("assemblyEnabled").checked = true;
    document.getElementById("assemblyCostSetting").value = 45;
    updateSubFields();
    onInputChange();
  } else if (selectedProductType === "Пакет А3") {
    View.setFormat("420×594");
    document.getElementById("paperType").value = "matt";
    View.updatePaperOptions();
    document.getElementById("densityInput").value = 200;
    document.getElementById("laminationEnabled").checked = true;
    document.getElementById("laminationSides").checked = true;
    document.getElementById("diecutEnabled").checked = true;
    document.getElementById("diecutStampCostSetting").value = 0;
    document.getElementById("assemblyEnabled").checked = true;
    document.getElementById("assemblyCostSetting").value = 25;
    updateSubFields();
    onInputChange();
  } else {
    restoreDefaultSheetFormats();
    onInputChange();
  }
}

/**
 * Восстановление всех форматов листов
 */
function restoreDefaultSheetFormats() {
  Config.SHEET_FORMATS.length = 0;
  Config.SHEET_FORMATS.push(
    { name: "Z", label: "Цифра SRA3", paperSize: { w: 320, h: 450 }, printArea: { w: 310, h: 430 }},
    { name: "E", label: "Цифра B2", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 }},
    { name: "B", label: "Офсет 47×62", paperSize: { w: 470, h: 620 }, printArea: { w: 450, h: 610 }},
    { name: "R", label: "Офсет 47×65", paperSize: { w: 470, h: 650 }, printArea: { w: 450, h: 640 }},
    { name: "A", label: "Офсет 50×70", paperSize: { w: 500, h: 700 }, printArea: { w: 480, h: 690 }},
    { name: "M", label: "Офсет 52×72", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 }}
  );
}

/**
 * Изменение множителя количества
 */
export function changeMultiplier(delta) {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value) || 1;
  value += delta;
  if (value < 1) value = 1;
  input.value = value;
  onMultiplierChange();
}

/**
 * Обработчик изменения множителя
 */
export function onMultiplierChange() {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value);
  if (value < 1 || isNaN(value)) {
    input.value = 1;
    value = 1;
  }
  onInputChange();
}

/**
 * Генерация прайс-листа по форматам с ценой продажи
 */
export function generatePriceListByFormatsWithSellingPrice() {
  const container = document.getElementById("priceListWithPriceContainer");
  container.innerHTML = "";

  const productType = selectedProductType || "Продукция";
  const w = Number(document.getElementById("width").value);
  const h = Number(document.getElementById("height").value);
  const sides = s;
  const paperType = document.getElementById("paperType").value;
  const isCustomPaper = paperType === "designer" || paperType === "adhesive";
  const customPaperPrice = isCustomPaper ? Number(document.getElementById("customPaperPrice").value || 0) : 0;
  const markupPercent = getMarkupPercent();
  const markupFactor = (100 + markupPercent) / 100;

  if (!w || !h) {
    alert("Заполните размер изделия.");
    return;
  }

  const W = w + 4;
  const H = h + 4;
  const quantities = Array.from(document.querySelectorAll("#quantityButtons button"))
    .map(btn => Number(btn.dataset.qty || btn.textContent.replace(/\D+/g, "")))
    .filter(q => q > 0);

  if (!quantities.length) {
    alert("Нет доступных тиражей для отображения.");
    return;
  }

  const densities = isCustomPaper ? [0] : (Config.DENSITY_MAP[paperType] || []);

  Config.SHEET_FORMATS.forEach(sheet => {
    const printW = sheet.printArea.w;
    const printH = sheet.printArea.h;

    const v1 = Math.floor(printW / W) * Math.floor(printH / H);
    const v2 = Math.floor(printW / H) * Math.floor(printH / W);
    const N_opt = Math.max(v1, v2);

    if (N_opt === 0) return;

    const extraSheets = ["Z", "E"].includes(sheet.name) ? 3 : 250;
    const areaSheet = (sheet.paperSize.w / 1000) * (sheet.paperSize.h / 1000);

    const printCostPerSheet = sheet.name === "Z" ? c_p_Z :
                              sheet.name === "E" ? c_p_E : c_p_Offset;

    const setupPrintValue = sheet.name === "Z" ? P_Z :
                            sheet.name === "E" ? P_E : P_Offset;

    const table = document.createElement("table");
    table.className = "result-table";
    table.style.marginBottom = "40px";

    if (isCustomPaper) {
      const sheetRatio = ["Z", "E"].includes(sheet.name) ? 0.25 : 0.5;
      table.innerHTML = `
        <thead>
          <tr><th colspan="${quantities.length + 1}">Формат: ${View.formatSheetLabel(sheet.name)} - ${Model.getPaperTypeLabel(paperType)} ${customPaperPrice} руб/лист</th></tr>
          <tr>
            <th>Формат</th>
            ${quantities.map(q => `<th>${q} шт.</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${w}×${h}</td>
            ${quantities.map(q => {
              const baseSheets = Math.ceil(q / N_opt);
              const totalSheets = baseSheets + extraSheets;
              const paperTotal = customPaperPrice * totalSheets * sheetRatio;
              const printTotal = printCostPerSheet * totalSheets * sides + setupPrintValue;
              const total = paperTotal + printTotal;
              const priceWithMarkup = total * markupFactor;
              return `<td>${Math.round(priceWithMarkup)} р.</td>`;
            }).join("")}
          </tr>
        </tbody>
      `;
    } else {
      table.innerHTML = `
        <thead>
          <tr><th colspan="${quantities.length + 1}">Формат: ${View.formatSheetLabel(sheet.name)}</th></tr>
          <tr>
            <th>Плотность г/м²</th>
            ${quantities.map(q => `<th>${q} шт.</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${densities.map(density => {
            const paperPricePerKg = Model.getPaperPriceByTypeAndDensity(paperType, density);
            return `
              <tr>
                <td>${density}</td>
                ${quantities.map(q => {
                  const baseSheets = Math.ceil(q / N_opt);
                  const totalSheets = baseSheets + extraSheets;
                  const weightSheet = areaSheet * (density / 1000);
                  const paperTotal = weightSheet * paperPricePerKg * totalSheets;
                  const printTotal = printCostPerSheet * totalSheets * sides + setupPrintValue;
                  const total = paperTotal + printTotal;
                  const priceWithMarkup = total * markupFactor;
                  return `<td>${Math.round(priceWithMarkup)} р.</td>`;
                }).join("")}
              </tr>
            `;
          }).join("")}
        </tbody>
      `;
    }

    container.appendChild(table);
  });

  window.scrollTo({ top: container.offsetTop, behavior: "smooth" });
}

/**
 * Рассчитывает результат брошюры
 */
export function calculateBrochureResult() {
  if (!selectedBrochureFormat) return;
  const inputField = document.getElementById("brochureInput");
  let value = parseInt(inputField.value.replace(/\D+/g, ""), 10);
  if (isNaN(value)) {
    document.getElementById("brochureOutput").value = "";
    return;
  }

  let divisor = 1;
  switch (selectedBrochureFormat) {
    case "A6": divisor = 32; break;
    case "A5": divisor = 16; break;
    case "A4": divisor = 8; break;
    case "210x210": divisor = 12; break;
  }

  const result = Math.ceil(value / divisor);
  document.getElementById("brochureOutput").value = result;
}

/**
 * Увеличивает цену на 500
 */
export function increasePrice(index) {
  if (savedResults[index]) {
    const currentCost = savedResults[index].cost;
    const currentPrice = savedResults[index].priceOverride !== null ?
                         savedResults[index].priceOverride :
                         currentCost * ((100 + getMarkupPercent()) / 100);
    savedResults[index].priceOverride = currentPrice + 500;
    View.renderSavedList(savedResults, getMarkupPercent());
  }
}

/**
 * Копирует цены в буфер обмена
 */
export function copyToClipboard() {
  if (!savedResults.length) {
    alert("Нет данных для копирования");
    return;
  }

  const text = savedResults.map(res => {
    const cost = res.cost;
    const hasOverride = res.priceOverride !== null;
    const price = hasOverride ? res.priceOverride : cost * ((100 + getMarkupPercent()) / 100);
    const formattedPrice = price.toFixed(2);
    const postpress = [];
    if (res.cuttingEnabled) postpress.push("Резка");
    if (res.laminationEnabled) postpress.push("Ламинация " + res.laminationSides);
    if (res.scoreEnabled) postpress.push("Биговка");
    if (res.foldingEnabled) postpress.push("Фальцовка");
    if (res.diecutEnabled) postpress.push("Вырубка");
    if (res.uvLacquerEnabled) postpress.push("УФ-лак");
    if (res.embossingEnabled) postpress.push("Тиснение");
    if (res.assemblyEnabled) postpress.push("Сборка");

    const postpressText = postpress.length ? ", " + postpress.join(", ") : "";
    const title = res.productType ? `${res.productType}, ` : "";
    const multiplierText = (res.multiplier && res.multiplier > 1) ? ` (×${res.multiplier})` : "";
    let paperInfo = `${Model.getPaperTypeLabel(res.paperType)} ${res.density} г/м²`;
    if (res.paperType === "designer" || res.paperType === "adhesive") {
      paperInfo = `${Model.getPaperTypeLabel(res.paperType)} ${res.customPaperPrice} руб/лист`;
    }

    return `${title}${res.productSize}${multiplierText}, ${res.color}, ${paperInfo}${postpressText} — ${res.quantity} шт → ${formattedPrice} руб.`;
  }).join("\n");

  navigator.clipboard.writeText(text).then(() => {
    alert("Цены скопированы в буфер обмена!");
  }).catch(() => {
    alert("Ошибка копирования");
  });
}
