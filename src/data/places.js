export const PLACES = [
  { id: 'pc1',  t: 'pc',   n: 'ПК 1',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'pc2',  t: 'pc',   n: 'ПК 2',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'pc3',  t: 'pc',   n: 'ПК 3',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'pc4',  t: 'pc',   n: 'ПК 4',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'pc5',  t: 'pc',   n: 'ПК 5',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'pc6',  t: 'pc',   n: 'ПК 6',           r: 350,  cap: 2, zone: 'PC Arena' },
  { id: 'ps1',  t: 'ps',   n: 'PS5, диван 1',   r: 500,  cap: 4, zone: 'Console lounge' },
  { id: 'ps2',  t: 'ps',   n: 'PS5, диван 2',   r: 500,  cap: 4, zone: 'Console lounge' },
  { id: 'vr1',  t: 'vr',   n: 'VR, кабина 1',   r: 700,  cap: 2, zone: 'VR' },
  { id: 'vr2',  t: 'vr',   n: 'VR, кабина 2',   r: 700,  cap: 2, zone: 'VR' },
  { id: 'room', t: 'room', n: 'Приват-комната', r: 1800, cap: 8, zone: 'Приват-комната' },
];

export const placeById = (id) => PLACES.find(p => p.id === id);

export const H0 = 12;
export const H1 = 26;
export const HOURS = Array.from({ length: 14 }, (_, i) => 12 + i);

export const pad = (n) => String(n % 24).padStart(2, '0');
export const fmt = (n) => Number(n).toLocaleString('ru-RU') + ' ₽';

export function price(rate, dur) {
  const sum = rate * dur;
  const disc = dur >= 3 ? Math.round(sum * 0.1) : 0;
  return { sum, disc, total: sum - disc };
}