// scripts/view.js

/**
 * Отрисовывает таблицу результатов
 */
export function renderResultsTable(results, multiplier = 1) {
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";

  if (!results.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="14">Нажмите «Рассчитать» для вывода результата</td>`;
    resultsTable.appendChild(row);
    return;
  }

  // Обновляем заголовок "Итого"
  const lastHeader = document.querySelector('#resultsBody th:last-child');
  lastHeader.textContent = multiplier > 1 ? `Итого (×${multiplier})` : 'Итого';

  results.forEach(result => {
    const row = document.createElement("tr");

    if (result.N_opt === 0 && result.quantity > 0) {
      row.innerHTML = `<td colspan="14">Не помещается</td>`;
    } else {
      row.innerHTML = `
        <td>
          <button class="remember-btn" onclick='rememberResult(
            "${result.format}",
            "${result.productSize}",
            "${result.color}",
            "${result.paperType}",
            ${result.density},
            ${result.quantity},
            ${result.cost.toFixed(2)},
            ${result.cuttingEnabled},
            ${result.laminationEnabled},
            "${result.laminationSides}",
            ${result.scoreEnabled},
            ${result.foldingEnabled},
            ${result.diecutEnabled},
            ${result.uvLacquerEnabled},
            ${result.embossingEnabled},
            ${result.assemblyEnabled}
          )'>
            ➕ ${formatSheetLabel(result.format)}
          </button>
        </td>
        <td>${result.N_opt}</td>
        <td>${result.totalSheets}</td>
        <td>${result.paperTotal.toFixed(2)}</td>
        <td>${result.printTotal.toFixed(2)}</td>
        <td>${result.cuttingEnabled ? result.cuttingTotal.toFixed(2) : "—"}</td>
        <td>${result.laminationEnabled ? result.laminationTotal.toFixed(2) : "—"}</td>
        <td>${result.scoreEnabled ? result.scoreTotal.toFixed(2) : "—"}</td>
        <td>${result.foldingEnabled ? result.foldingTotal.toFixed(2) : "—"}</td>
        <td>${result.diecutEnabled ? result.diecutTotal.toFixed(2) : "—"}</td>
        <td>${result.uvLacquerEnabled ? result.uvLacquerTotal.toFixed(2) : "—"}</td>
        <td>${result.embossingEnabled ? result.embossingTotal.toFixed(2) : "—"}</td>
        <td>${result.assemblyEnabled ? result.assemblyTotal.toFixed(2) : "—"}</td>
        <td><b data-original="${result.cost.toFixed(2)}">${(result.cost * multiplier).toFixed(2)}</b></td>
      `;
    }

    resultsTable.appendChild(row);
  });
}

/**
 * Отрисовывает список сохранённых результатов
 */
export function renderSavedList(savedResults, markupPercent = 20) {
  const listCost = document.getElementById("savedCalculations_cost");
  const listPrice = document.getElementById("savedCalculations_price");
  const listProfit = document.getElementById("savedCalculations_profit");

  [listCost, listPrice, listProfit].forEach(list => {
    while (list.firstChild) list.removeChild(list.firstChild);
  });

  if (!savedResults.length) {
    showEmptyMessage();
    return;
  }

  hideEmptyMessage();
  const markupFactor = (100 + markupPercent) / 100;

  savedResults.forEach((res, index) => {
    const cost = res.cost;
    const hasOverride = res.priceOverride !== null;
    const priceWithMarkup = hasOverride ? res.priceOverride : cost * markupFactor;
    const profit = priceWithMarkup - cost;

    const postpress = [];
    if (res.cuttingEnabled) postpress.push("Резка");
    if (res.laminationEnabled) postpress.push(`Ламинация ${res.laminationSides}`);
    if (res.scoreEnabled) postpress.push("Биговка");
    if (res.foldingEnabled) postpress.push("Фальцовка");
    if (res.diecutEnabled) postpress.push("Вырубка");
    if (res.uvLacquerEnabled) postpress.push("УФ-лак");
    if (res.embossingEnabled) postpress.push("Тиснение");
    if (res.assemblyEnabled) postpress.push("Сборка");

    const postpressText = postpress.length ? ", " + postpress.join(", ") : "";
    const title = res.productType ? `${res.productType}, ` : "";
    const multiplierText = (res.multiplier && res.multiplier > 1) ? ` (×${res.multiplier})` : "";

    // Себестоимость
    const divCost = createSavedItem(`
      <strong>${title}${res.productSize}${multiplierText}</strong>, ${res.color}, 
      ${getPaperTypeLabel(res.paperType)} ${res.density} г/м²${postpressText} — ${res.quantity} шт → 
      <b>${cost.toFixed(2)} руб.</b>
    `);
    listCost.appendChild(divCost);

    // Цена продажи (+ кнопка +500)
    const divPrice = createSavedItem(`
      <strong>${title}${res.productSize}${multiplierText}</strong>, ${res.color}, 
      ${getPaperTypeLabel(res.paperType)} ${res.density} г/м²${postpressText} — ${res.quantity} шт → 
      <b>${priceWithMarkup.toFixed(2)} руб.</b>
      <button onclick='increasePrice(${index})' style="margin-left: 10px; padding: 4px 8px; font-size: 12px;">+500</button>
    `);
    listPrice.appendChild(divPrice);

    // Прибыль
    const divProfit = createSavedItem(`
      <strong>${title}${res.productSize}${multiplierText}</strong>, ${res.color}, 
      ${getPaperTypeLabel(res.paperType)} ${res.density} г/м²${postpressText} — ${res.quantity} шт → 
      <b>${profit.toFixed(2)} руб.</b>
    `);
    listProfit.appendChild(divProfit);
  });
}

function formatSheetLabel(sheetName) {
  const labels = {
    Z: "Цифра SRA3",
    E: "Цифра B2",
    A: "Офсет 50×70",
    B: "Офсет 47×62",
    R: "Офсет 47×65",
    M: "Офсет 52×72"
  };
  return labels[sheetName] || sheetName;
}

function getPaperTypeLabel(type) {
  return type === "offset" ? "Офсетная" :
         type === "matt" ? "Мелованная" :
         type === "cardboard" ? "Картон" :
         type === "designer" ? "Дизайнерская" :
         type === "adhesive" ? "Самоклейка" : type;
}

function createSavedItem(content) {
  const div = document.createElement("div");
  div.className = "saved-item";
  div.innerHTML = content + "<hr>";
  return div;
}

function showEmptyMessage() {
  document.getElementById("savedMessage_cost").style.display = "block";
  document.getElementById("savedMessage_price").style.display = "block";
  document.getElementById("savedMessage_profit").style.display = "block";
}

function hideEmptyMessage() {
  document.getElementById("savedMessage_cost").style.display = "none";
  document.getElementById("savedMessage_price").style.display = "none";
  document.getElementById("savedMessage_profit").style.display = "none";
}

export function updateFormatButtons(width, height) {
  const currentW = width;
  const currentH = height;

  document.querySelectorAll("#formatButtons button").forEach(btn => {
    const btnText = btn.textContent.trim().match(/(\d+)×(\d+)/)?.[0] || "";
    btn.classList.remove("selected");
    if (btnText === `${currentW}×${currentH}` || btnText === `${currentH}×${currentW}`) {
      btn.classList.add("selected");
    }
  });
}

export function updateQuantityButtons(quantity) {
  const container = document.getElementById("quantityButtons");
  const quantities = [50, 100, 200, 300, 500, 1000, 3000, 5000];

  if (!container.children.length) {
    quantities.forEach(qty => {
      const btn = document.createElement("button");
      btn.textContent = qty + " шт.";
      btn.dataset.qty = qty;
      btn.onclick = () => {
        document.getElementById("quantity").value = qty;
        updateQuantityButtons(qty);
        onInputChange();
      };
      container.appendChild(btn);
    });
  }

  document.querySelectorAll("#quantityButtons button").forEach(btn => {
    const qty = parseInt(btn.dataset.qty || btn.textContent.replace(/\D+/g, ""), 10);
    btn.classList.toggle("selected", qty === quantity);
  });
}

export function togglePrintSettings() {
  const panel = document.getElementById("printSettingsPanel");
  const btn = document.getElementById("btnPrint");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  btn.textContent = panel.style.display === "none" ? "⚙️ Печать ▼" : "⚙️ Печать ▲";
}

export function togglePostpressSettings() {
  const panel = document.getElementById("postpressPanel");
  const btn = document.getElementById("btnPostpress");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  btn.textContent = panel.style.display === "none" ? "⚙️ Послепечатные работы ▼" : "⚙️ Послепечатные работы ▲";
}

export function updateSubFieldsVisibility() {
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
}

export function setSides(val) {
  const s = val;
  document.querySelectorAll(".side-buttons button").forEach(btn => btn.classList.remove("selected"));
  if (val === 1) {
    document.getElementById("btn_4_0").classList.add("selected");
  } else {
    document.getElementById("btn_4_4").classList.add("selected");
  }
}

export function selectProductType(buttonElement, productType) {
  document.querySelectorAll("#productTypeButtons button").forEach(btn => btn.classList.remove("selected"));
  buttonElement.classList.add("selected");
  selectedProductType = productType;
}

export function toggleBrochureOptions() {
  const panel = document.getElementById("brochureOptions");
  const btn = document.getElementById("btnBrochure");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  btn.textContent = panel.style.display === "none" ? "📘 Брошюра ▼" : "📘 Брошюра ▲";
}

export function selectBrochureFormat(button, format) {
  document.querySelectorAll("#brochureFormatButtons button").forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected");
  selectedBrochureFormat = format;
  calculateBrochureResult();
}

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

export function copyToClipboard(savedResults, markupPercent = 20) {
  if (!savedResults.length) {
    alert("Нет данных для копирования");
    return;
  }

  const text = savedResults.map(res => {
    const cost = res.cost;
    const hasOverride = res.priceOverride !== null;
    const price = hasOverride ? res.priceOverride : cost * ((100 + markupPercent) / 100);
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
    let paperInfo = `${getPaperTypeLabel(res.paperType)} ${res.density} г/м²`;
    if (res.paperType === "designer" || res.paperType === "adhesive") {
      paperInfo = `${getPaperTypeLabel(res.paperType)} ${res.customPaperPrice} руб/лист`;
    }

    return `${title}${res.productSize}${multiplierText}, ${res.color}, ${paperInfo}${postpressText} — ${res.quantity} шт → ${formattedPrice} руб.`;
  }).join("\n");

  navigator.clipboard.writeText(text).then(() => {
    alert("Цены скопированы в буфер обмена!");
  }).catch(() => {
    alert("Ошибка копирования");
  });
}

export function increasePrice(index, savedResults) {
  if (savedResults[index]) {
    const currentCost = savedResults[index].cost;
    const currentPrice = savedResults[index].priceOverride !== null ?
                         savedResults[index].priceOverride :
                         currentCost * ((100 + Number(document.getElementById("markupPercent").value || 20)) / 100;
    savedResults[index].priceOverride = currentPrice + 500;
    renderSavedList(savedResults);
  }
}

export function generatePriceListByFormatsWithSellingPrice(savedResults, markupPercent) {
  const container = document.getElementById("priceListWithPriceContainer");
  container.innerHTML = "";
  const productType = selectedProductType || "Продукция";

  const width = Number(document.getElementById("width").value);
  const height = Number(document.getElementById("height").value);
  const sides = s;
  const paperType = document.getElementById("paperType").value;
  const isCustomPaper = paperType === "designer" || paperType === "adhesive";
  const customPaperPrice = isCustomPaper ? Number(document.getElementById("customPaperPrice").value || 0) : 0;

  if (!width || !height) {
    alert("Заполните размер изделия.");
    return;
  }

  const W = width + 4;
  const H = height + 4;
  const quantities = Array.from(document.querySelectorAll("#quantityButtons button"))
    .map(btn => Number(btn.dataset.qty || btn.textContent.replace(/\D+/g, "")))
    .filter(q => q > 0);

  if (!quantities.length) {
    alert("Нет доступных тиражей для отображения.");
    return;
  }

  const densities = isCustomPaper ? [0] : (densityMap[paperType] || []);

  sheetFormats.forEach(sheet => {
    const printW = sheet.printArea.w;
    const printH = sheet.printArea.h;
    const v1 = Math.floor(printW / W) * Math.floor(printH / H);
    const v2 = Math.floor(printW / H) * Math.floor(printH / W);
    const N_opt = Math.max(v1, v2);
    if (N_opt === 0) return;

    const extraSheets = ["Z", "E"].includes(sheet.name) ? 3 : 250;
    const areaSheet = (sheet.paperSize.w / 1000) * (sheet.paperSize.h / 1000);
    const printCostPerSheet = sheet.name === "Z" ? c_p_Z : sheet.name === "E" ? c_p_E : c_p_Offset;
    const setupPrintValue = sheet.name === "Z" ? P_Z : sheet.name === "E" ? P_E : P_Offset;

    const table = document.createElement("table");
    table.className = "result-table";
    table.style.marginBottom = "40px";

    if (isCustomPaper) {
      const sheetRatio = ["Z", "E"].includes(sheet.name) ? 0.25 : 0.5;
      table.innerHTML = `
        <thead>
          <tr><th colspan="${quantities.length + 1}">Формат: ${formatLabels[sheet.name]} - ${getPaperTypeLabel(paperType)} ${customPaperPrice} руб/лист</th></tr>
          <tr>
            <th>Формат</th>
            ${quantities.map(q => `<th>${q} шт.</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${width}×${height}</td>
            ${quantities.map(q => {
              const baseSheets = Math.ceil(q / N_opt);
              const totalSheets = baseSheets + extraSheets;
              const paperTotal = customPaperPrice * totalSheets * sheetRatio;
              const printTotal = printCostPerSheet * totalSheets * sides + setupPrintValue;
              const total = paperTotal + printTotal;
              const priceWithMarkup = total * ((100 + markupPercent) / 100);
              return `<td>${Math.round(priceWithMarkup)} р.</td>`;
            }).join("")}
          </tr>
        </tbody>
      `;
    } else {
      table.innerHTML = `
        <thead>
          <tr><th colspan="${quantities.length + 1}">Формат: ${formatLabels[sheet.name]}</th></tr>
          <tr>
            <th>Плотность г/м²</th>
            ${quantities.map(q => `<th>${q} шт.</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${densities.map(density => {
            const paperPricePerKg = getPaperPriceByTypeAndDensity(paperType, density);
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
                  const priceWithMarkup = total * ((100 + markupPercent) / 100);
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

export function changeMultiplier(delta) {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value) || 1;
  value += delta;
  if (value < 1) value = 1;
  input.value = value;
  onMultiplierChange();
}

export function onMultiplierChange() {
  const input = document.getElementById("quantityMultiplier");
  let value = Number(input.value);
  if (value < 1 || isNaN(value)) {
    input.value = 1;
  }
  onInputChange();
}

export function updateDisplayPaper(paperType, density, customPrice = 0) {
  const display_paper = document.getElementById("display_paper");
  const label = getPaperTypeLabel(paperType);
  if (paperType === "designer" || paperType === "adhesive") {
    display_paper.textContent = `Выбрано: ${label} ${customPrice} руб/лист`;
  } else {
    display_paper.textContent = `Выбрано: ${label} ${density} г/м²`;
  }
}

export function updatePaperOptions(paperType) {
  const optionsDiv = document.getElementById("paperOptions");
  const customPriceDiv = document.getElementById("customPaperPriceContainer");
  const paperPricePerKgLabel = document.getElementById("paperPricePerKgLabel");
  const paperPricePerKg = document.getElementById("paperPricePerKg");

  optionsDiv.innerHTML = "";

  if (paperType === "designer" || paperType === "adhesive") {
    customPriceDiv.style.display = "block";
    paperPricePerKgLabel.style.display = "none";
    paperPricePerKg.style.display = "none";
    const densities = densityMap[paperType] || [300];
    densities.forEach(d => {
      const btn = document.createElement("button");
      btn.textContent = d + " г/м²";
      btn.onclick = () => {
        document.querySelectorAll("#paperOptions button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        document.getElementById("densityInput").value = d;
        updateDisplayPaper(paperType, d, customPriceDiv.querySelector("input").value);
        onInputChange();
      };
      optionsDiv.appendChild(btn);
    });
    if (optionsDiv.children.length) optionsDiv.children[0].click();
  } else {
    customPriceDiv.style.display = "none";
    paperPricePerKgLabel.style.display = "block";
    paperPricePerKg.style.display = "block";
    const densities = densityMap[paperType] || [];
    if (!densities.length) return;
    densities.forEach(d => {
      const btn = document.createElement("button");
      btn.textContent = d + " г/м²";
      btn.onclick = () => {
        document.querySelectorAll("#paperOptions button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        document.getElementById("densityInput").value = d;
        const price = getPaperPriceByTypeAndDensity(paperType, d);
        document.getElementById("paperPricePerKg").value = price;
        updateDisplayPaper(paperType, d);
        onInputChange();
      };
      optionsDiv.appendChild(btn);
    });
    if (optionsDiv.children.length) optionsDiv.children[0].click();
  }
}

export function updateProductTypeButtons() {
  const buttons = document.querySelectorAll("#productTypeButtons button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedProductType = btn.getAttribute("data-type");
      if (selectedProductType === "Пакет А4" || selectedProductType === "Пакет А3") {
        setFormat(selectedProductType === "Пакет А4" ? "420×594" : "420×594");
        document.getElementById("paperType").value = "matt";
        updatePaperOptions("matt");
        document.getElementById("densityInput").value = 200;
        document.querySelector('input[name="laminationSides"][value="1+0"]').checked = true;
        document.getElementById("laminationEnabled").checked = true;
        document.getElementById("diecutEnabled").checked = true;
        document.getElementById("diecutStampCostSetting").value = "0";
        document.getElementById("assemblyEnabled").checked = true;
        document.getElementById("assemblyCostSetting").value = selectedProductType === "Пакет А4" ? "45" : "25";
        updateSubFieldsVisibility();
        onInputChange();
      } else {
        restoreDefaultSheetFormats();
        calculate();
      }
    });
  });
}

export function restoreDefaultSheetFormats() {
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

export function updateFormatButtons() {
  const currentW = Number(document.getElementById("width").value);
  const currentH = Number(document.getElementById("height").value);
  document.querySelectorAll("#formatButtons button").forEach(btn => {
    const btnText = btn.textContent.match(/(\d+)×(\d+)/)?.[0] || "";
    btn.classList.remove("selected");
    if (btnText === `${currentW}×${currentH}` || btnText === `${currentH}×${currentW}`) {
      btn.classList.add("selected");
    }
  });
}

export function setFormat(sizeStr) {
  const size = sizeStr.split("×");
  document.getElementById("width").value = size[0];
  document.getElementById("height").value = size[1];
  updateFormatButtons();
  onInputChange();
}

export function addQuantityButtons() {
  const N = Number(document.getElementById("quantity").value);
  const container = document.getElementById("quantityButtons");
  container.innerHTML = "";

  [50, 100, 200, 300, 500, 1000, 3000, 5000].forEach(qty => {
    const btn = document.createElement("button");
    btn.textContent = qty + " шт.";
    btn.dataset.qty = qty;
    btn.onclick = () => {
      document.getElementById("quantity").value = qty;
      document.querySelectorAll("#quantityButtons button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      onInputChange();
    };
    container.appendChild(btn);
  });

  updateQuantityButtons(N);
}
