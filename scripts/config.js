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

export const FORMAT_LABELS = {
  Z: "Цифра SRA3",
  E: "Цифра B2",
  A: "Офсет 50×70",
  B: "Офсет 47×62",
  R: "Офсет 47×65",
  M: "Офсет 52×72"
};
