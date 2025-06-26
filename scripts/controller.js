// scripts/controller.js

import * as Model from './model.js';
import * as View from './view.js';

let s = 1;
let selectedProductType = "";
let savedResults = [];
let sheetFormats = [...Config.SHEET_FORMATS];
let densityMap = Config.DENSITY_MAP;

export function initEventListeners() {
  document.getElementById("width").addEventListener("input", onInputChange);
  document.getElementById("height").addEventListener("input", onInputChange);
  document.getElementById("quantity").addEventListener("input", onInputChange);
  document.getElementById("paperType").addEventListener("change", handlePaperTypeChange);
  document.getElementById("customPaperPrice").addEventListener("input", onInputChange);

  document.querySelectorAll("#productTypeButtons button").forEach(btn => {
    btn.addEventListener("click", () => selectProductType(btn));
  });

  document.querySelectorAll(".side-buttons button").forEach(btn => {
    btn.addEventListener("click", () => setSides(parseInt(btn.dataset.sides)));
  });

  document.querySelectorAll("#formatButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
      const sizeStr = btn.textContent.trim().match(/(\d+)×(\d+)/)?.[0];
      if (sizeStr) {
        const [w, h] = sizeStr.split("×").map(Number);
        document.getElementById("width").value = w;
        document.getElementById("height").value = h;
        updateFormatButtons();
        onInputChange();
      }
    });
  });

  document.getElementById("btnPrint").addEventListener("click", View.togglePrintSettings);
  document.getElementById("btnPostpress").addEventListener("click", View.togglePostpressSettings);
  document.getElementById("laminationEnabled").addEventListener("change", updateSubFields);
  document.getElementById("scoreEnabled").addEventListener("change", updateSubFields);
  document.getElementById("foldingEnabled").addEventListener("change", updateSubFields);
  document.getElementById("diecutEnabled").addEventListener("change", updateSubFields);
  document.getElementById("uvLacquerEnabled").addEventListener("change", updateSubFields);
  document.getElementById("embossingEnabled").addEventListener("change", updateSubFields);
  document.getElementById("assemblyEnabled").addEventListener("change", updateSubFields);

  document.getElementById("quantityMultiplier").addEventListener("input", onMultiplierChange);

  document.getElementById("brochureInput").addEventListener("input", View.calculateBrochureResult);

  window.addEventListener("load", () => {
    View.updatePaperOptions();
    View.addQuantityButtons();
    updateFormatButtons();
    onInputChange();
  });
}

function setSides(val) {
  s = val;
  document.querySelectorAll(".side-buttons button").forEach(btn => btn.classList.remove("selected"));
  if (val === 1) {
    document.getElementById("btn_4_0").classList.add("selected");
  } else {
    document.getElementById("btn_4_4").classList.add("selected");
  }
  onInputChange();
}

function handlePaperTypeChange(e) {
  const paperType = e.target.value;
  const isCustom = paperType === "designer" || paperType === "adhesive";
  document.getElementById("customPaperPriceContainer").style.display = isCustom ? "block" : "none";

  View.updatePaperOptions(paperType);
  onInputChange();
}

function updateSubFields() {
  const fields = [
    { checkboxId: 'laminationEnabled', containerId: 'laminationOptions' },
    { checkboxId: 'scoreEnabled', containerId: 'scoreOptions' },
    { checkboxId: 'foldingEnabled', containerId: 'foldingOptions' },
    { checkboxId: 'diecutEnabled', containerId: 'diecutOptions' },
    { checkboxId: 'uvLacquerEnabled', containerId: 'uvLacquerOptions' },
    { checkboxId: 'embossingEnabled', containerId: 'embossingOptions' },
    { checkboxId: 'assemblyEnabled', containerId: 'assemblyOptions' },
    { checkboxId: 'cuttingEnabled', containerId: 'cuttingOptions' }
  ];

  fields.forEach(({ checkboxId, containerId }) => {
    const isChecked = document.getElementById(checkboxId)?.checked ?? false;
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = isChecked ? "block" : "none";
    }
  });

  onInputChange();
}

function selectProductType(buttonElement) {
  document.querySelectorAll("#productTypeButtons button").forEach(btn => btn.classList.remove("selected"));
  buttonElement.classList.add("selected");
  selectedProductType = buttonElement.getAttribute("data-type");
  if (selectedProductType === "Пакет А4") {
    View.setFormat("420×594");
    document.getElementById("paperType").value = "matt";
    View.updatePaperOptions("matt");
    document.getElementById("densityInput").value = 200;
    document.getElementById("laminationEnabled").checked = true;
    document.getElementById("diecutEnabled").checked = true;
    document.getElementById("diecutStampCostSetting").value = 0;
    document.getElementById("assemblyEnabled").checked = true;
    document.getElementById("assemblyCostSetting").value = 45;
    updateSubFields();
    onInputChange();
  } else if (selectedProductType === "Пакет А3") {
    View.setFormat("420×594");
    document.getElementById("paperType").value = "matt";
    View.updatePaperOptions("matt");
    document.getElementById("densityInput").value = 200;
    document.getElementById("laminationEnabled").checked = true;
    document.getElementById("diecutEnabled").checked = true;
    document.getElementById("diecutStampCostSetting").value = 0;
    document.getElementById("assemblyEnabled").checked = true;
    document.getElementById("assemblyCostSetting").value = 25;
    updateSubFields();
    onInputChange();
  } else {
    restoreDefaultSheetFormats();
    calculate();
  }
}

function restoreDefaultSheetFormats() {
  sheetFormats.length = 0;
  sheetFormats.push(
    { name: "Z", paperSize: { w: 320, h: 450 }, printArea: { w: 310, h: 430 } },
    { name: "E", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 } },
    { name: "B", paperSize: { w: 470, h: 620 }, printArea: { w: 450, h: 610 } },
    { name: "R", paperSize: { w: 470, h: 650 }, printArea: { w: 450, h: 640 } },
    { name: "A", paperSize: { w: 500, h: 700 }, printArea: { w: 480, h: 690 } },
    { name: "M", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 } }
  );
}

export function onInputChange() {
  calculate();
  View.renderSavedList(savedResults, getMarkupPercent());
}

function calculate() {
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";

  const w = Number(document.getElementById("width").value);
  const h = Number(document.getElementById("height").value);
  const N = Number(document.getElementById("quantity").value);
  const density = Number(document.getElementById("densityInput").value);
  const paperType = document.getElementById("paperType").value;
  const isCustomPaper = paperType === "designer" || paperType === "adhesive";
  const customPaperPrice = isCustomPaper ? Number(document.getElementById("customPaperPrice").value) : 0;
  const multiplier = Number(document.getElementById("quantityMultiplier").value) || 1;

  const c_p_Z = Number(document.getElementById("printCostZ").value);
  const P_Z = Number(document.getElementById("setupPrintZ").value);
  const c_p_E = Number(document.getElementById("printCostE").value);
  const P_E = Number(document.getElementById("setupPrintE").value);
  const c_p_Offset = Number(document.getElementById("printCostOffsetA2").value);
  const P_Offset = Number(document.getElementById("setupPrintOffsetA2").value);

  const cuttingEnabled = document.getElementById("cuttingEnabled")?.checked ?? false;
  const cuttingCost = Number(document.getElementById("cuttingCostSetting").value);
  const setupCutting = Number(document.getElementById("setupCutting").value);

  const laminationEnabled = document.getElementById("laminationEnabled")?.checked ?? false;
  const laminationCost = Number(document.getElementById("laminationCost").value);
  const setupLamination = Number(document.getElementById("setupLamination").value);
  const laminationSides = document.querySelector('input[name="laminationSides"]:checked')?.value ?? "1+0";

  const scoreEnabled = document.getElementById("scoreEnabled")?.checked ?? false;
  const scoreCost = Number(document.getElementById("scoreCost").value);
  const setupScore = Number(document.getElementById("setupScore").value);
  const scoreCount = Number(document.getElementById("scoreCountInput").value);

  const foldingEnabled = document.getElementById("foldingEnabled")?.checked ?? false;
  const foldingCost = Number(document.getElementById("foldingCostSetting").value);
  const setupFolding = Number(document.getElementById("setupFolding").value);

  const diecutEnabled = document.getElementById("diecutEnabled")?.checked ?? false;
  const diecutCost = Number(document.getElementById("diecutCostSetting").value);
  const setupDiecut = Number(document.getElementById("setupDiecut").value);
  const diecutStampCost = Number(document.getElementById("diecutStampCostSetting").value);

  const uvLacquerEnabled = document.getElementById("uvLacquerEnabled")?.checked ?? false;
  const uvLacquerCost = Number(document.getElementById("uvLacquerCostSetting").value);
  const setupUvLacquer = Number(document.getElementById("setupUvLacquer").value);

  const embossingEnabled = document.getElementById("embossingEnabled")?.checked ?? false;
  const embossingCost = Number(document.getElementById("embossingCostSetting").value);
  const setupEmbossing = Number(document.getElementById("setupEmbossing").value);
  const embossingKlischeCost = Number(document.getElementById("embossingKlischeCostSetting").value);

  const assemblyEnabled = document.getElementById("assemblyEnabled")?.checked ?? false;
  const assemblyCost = Number(document.getElementById("assemblyCostSetting").value);
  const setupAssembly = Number(document.getElementById("setupAssembly").value);

  const results = sheetFormats.map(sheet => {
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

    let paperTotal;
    if (isCustomPaper) {
      const sheetRatio = ["Z", "E"].includes(sheet.name) ? 0.25 : 0.5;
      paperTotal = customPaperPrice * totalSheets * sheetRatio;
    } else {
      const areaSheet = (sheet.paperSize.w / 1000) * (sheet.paperSize.h / 1000);
      const weightSheet = areaSheet * (density / 1000);
      const paperPricePerKg = Model.getPaperPriceByTypeAndDensity(paperType, density);
      paperTotal = weightSheet * paperPricePerKg * totalSheets;
    }

    const printCostPerSheet = sheet.name === "Z" ? c_p_Z :
                              sheet.name === "E" ? c_p_E : c_p_Offset;

    const setupPrintValue = sheet.name === "Z" ? P_Z :
                            sheet.name === "E" ? P_E : P_Offset;

    const printTotal = printCostPerSheet * totalSheets * s + setupPrintValue;

    const cuttingTotal = cuttingEnabled ? cuttingCost * totalSheets + setupCutting : 0;

    const laminationTotal = laminationEnabled ?
      laminationCost * totalSheets * (laminationSides === "1+1" ? 2 : 1) + setupLamination : 0;

    const scoreTotal = scoreEnabled ? N * scoreCount * scoreCost + setupScore : 0;

    const foldingTotal = foldingEnabled ? N * foldingCost + setupFolding : 0;

    const diecutTotal = diecutEnabled ? N * diecutCost + setupDiecut + diecutStampCost : 0;

    const uvLacquerTotal = uvLacquerEnabled ? uvLacquerCost * totalSheets + setupUvLacquer : 0;

    const embossingTotal = embossingEnabled ? N * embossingCost + setupEmbossing + embossingKlischeCost : 0;

    const assemblyTotal = assemblyEnabled ? N * assemblyCost + setupAssembly : 0;

    const total = paperTotal + printTotal + cuttingTotal + laminationTotal + scoreTotal +
                  foldingTotal + diecutTotal + uvLacquerTotal + embossingTotal + assemblyTotal;

    const roundedTotal = Math.round(total / 10) * 10;
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

function getMarkupPercent() {
  return Number(document.getElementById("markupPercent").value) || 20;
}

export function rememberResult(format, productSize, color, paperType, density, quantity, cost, ...rest) {
  const [cuttingEnabled, laminationEnabled, laminationSides, scoreEnabled, foldingEnabled, diecutEnabled, uvLacquerEnabled, embossingEnabled, assemblyEnabled] = rest;
  const key = JSON.stringify({ format, productSize, color, paperType, density, quantity, cost, multiplier });
  if (savedResults.some(r => JSON.stringify(r) === key)) {
    alert("❗ Такой вариант уже сохранён.");
    return;
  }

  const customPaperPrice = (paperType === "designer" || paperType === "adhesive")
    ? Number(document.getElementById("customPaperPrice").value) || 0
    : 0;

  savedResults.push({
    format, productSize, color, paperType, density, quantity, cost, multiplier,
    productType: selectedProductType,
    cuttingEnabled, laminationEnabled, laminationSides,
    scoreEnabled, foldingEnabled, diecutEnabled, uvLacquerEnabled, embossingEnabled, assemblyEnabled,
    customPaperPrice
  });

  View.renderSavedList(savedResults, getMarkupPercent());
}

export function changeMultiplier(delta) {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value) || 1;
  value += delta;
  if (value < 1) value = 1;
  input.value = value;
  onInputChange();
}

export function onMultiplierChange() {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value);
  if (value < 1 || isNaN(value)) input.value = 1;
  onInputChange();
}
