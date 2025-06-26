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

  const lastHeader = document.querySelector('#resultsBody th:last-child');
  lastHeader.textContent = multiplier > 1 ? `Итого (×${multiplier})` : 'Итого';

  results.forEach(result => {
    const row = document.createElement("tr");

    if (result.N_opt === 0 && result.quantity > 0) {
      row.innerHTML = `<td colspan="14">Не помещается</td>`;
    } else {
      row.innerHTML = `
        <td>
          <button class="remember-btn" onclick='rememberResult("${result.format}", "${result.productSize}", "${result.color}", "${result.paperType}", ${result.density}, ${result.quantity}, ${result.cost.toFixed(2)}, ${result.cuttingEnabled}, ${result.laminationEnabled}, "${result.laminationSides}", ${result.scoreEnabled}, ${result.foldingEnabled}, ${result.diecutEnabled}, ${result.uvLacquerEnabled}, ${result.embossingEnabled}, ${result.assemblyEnabled})'>
            ➕ ${getFormatLabel(result.format)}
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

export function getFormatLabel(name) {
  return Config.FORMAT_LABELS[name] || name;
}

export function getPaperTypeLabel(type) {
  return type === "offset" ? "Офсетная" :
         type === "matt" ? "Мелованная" :
         type === "cardboard" ? "Картон" :
         type === "designer" ? "Дизайнерская" :
         type === "adhesive" ? "Самоклейка" : type;
}

export function createSavedItem(content) {
  const div = document.createElement("div");
  div.className = "saved-item";
  div.innerHTML = content + "<hr>";
  return div;
}
