// scripts/config.js

export const SHEET_FORMATS = [
  { name: "Z", label: "Цифра SRA3", paperSize: { w: 320, h: 450 }, printArea: { w: 310, h: 430 } },
  { name: "E", label: "Цифра B2", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 } },
  { name: "B", label: "Офсет 47×62", paperSize: { w: 470, h: 620 }, printArea: { w: 450, h: 610 } },
  { name: "R", label: "Офсет 47×65", paperSize: { w: 470, h: 650 }, printArea: { w: 450, h: 640 } },
  { name: "A", label: "Офсет 50×70", paperSize: { w: 500, h: 700 }, printArea: { w: 480, h: 690 } },
  { name: "M", label: "Офсет 52×72", paperSize: { w: 520, h: 720 }, printArea: { w: 500, h: 710 } }
];

export const DENSITY_MAP = {
  offset: [80, 100, 120, 160, 190],
  matt: [90, 115, 130, 150, 170, 200, 250, 300],
  cardboard: [215, 230, 250, 270, 300, 320, 350],
  designer: [300],
  adhesive: [80]
};

export const PRINT_COSTS = {
  Z: { costPerSheet: 15, setup: 300 },
  E: { costPerSheet: 50, setup: 500 },
  default: { costPerSheet: 2, setup: 10000 }
};

export const POSTPRESS_DEFAULTS = {
  cutting: { cost: 1, setup: 300 },
  lamination: { cost: 12, setup: 300 },
  score: { cost: 2, setup: 300 },
  folding: { cost: 1, setup: 300 },
  diecut: { cost: 5, setup: 5000, stampCost: 5500 },
  uvLacquer: { cost: 10, setup: 5000 },
  embossing: { cost: 10, setup: 4500, klischeCost: 2000 },
  assembly: { cost: 5, setup: 300 }
};
