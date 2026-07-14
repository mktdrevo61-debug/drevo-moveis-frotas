// src/utils/formatters.js
/**
 * Shared formatting utilities for the Drevo Móveis frontend.
 * All functions are pure and free of side effects.
 */

// ─── formatCurrency ────────────────────────────────────────────────────────────
/**
 * Formats a number as Brazilian Real (BRL) currency.
 * Example: 24850.5 → 'R$ 24.850,50'
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── formatDate ───────────────────────────────────────────────────────────────
/**
 * Formats an ISO date string or Date object to Brazilian locale date.
 * Example: '2024-03-15T10:30:00Z' → '15/03/2024 às 10:30'
 * @param {string|Date} date
 * @param {boolean} includeTime Whether to include time (default true)
 * @returns {string}
 */
export function formatDate(date, includeTime = true) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    const datePart = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    }).format(d);

    if (!includeTime) return datePart;

    const timePart = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(d);

    return `${datePart} às ${timePart}`;
  } catch {
    return '—';
  }
}

// ─── formatMileage ────────────────────────────────────────────────────────────
/**
 * Formats a mileage number with thousands separator and 'km' suffix.
 * Example: 123456 → '123.456 km'
 * @param {number} km
 * @returns {string}
 */
export function formatMileage(km) {
  if (km == null || isNaN(km)) return '0 km';
  return `${new Intl.NumberFormat('pt-BR').format(Math.round(km))} km`;
}

// ─── partIdToLabel ────────────────────────────────────────────────────────────
/**
 * Maps a vehicle part_id to its full Portuguese label.
 * Used in the damage modal and damage list.
 *
 * @param {string} partId
 * @returns {string} Portuguese label, or a capitalized fallback
 */
const PART_LABELS = {
  // Front
  hood:               'Capô',
  bumper_front:       'Para-choque Dianteiro',
  windshield_front:   'Para-brisa Dianteiro',
  fender_front_left:  'Para-lama Dianteiro Esquerdo',
  fender_front_right: 'Para-lama Dianteiro Direito',
  headlight_left:     'Farol Esquerdo',
  headlight_right:    'Farol Direito',

  // Cabin / Top
  roof:               'Teto',
  pillar_a:           'Pilar A',
  pillar_b:           'Pilar B',
  pillar_c:           'Pilar C',

  // Doors
  door_front_left:    'Porta Dianteira Esquerda',
  door_front_right:   'Porta Dianteira Direita',
  door_rear_left:     'Porta Traseira Esquerda',
  door_rear_right:    'Porta Traseira Direita',

  // Rear
  trunk:              'Tampa do Baú',
  bumper_rear:        'Para-choque Traseiro',
  windshield_rear:    'Vidro Traseiro',
  taillight_left:     'Lanterna Traseira Esquerda',
  taillight_right:    'Lanterna Traseira Direita',

  // Side panels
  fender_rear_left:   'Para-lama Traseiro Esquerdo',
  fender_rear_right:  'Para-lama Traseiro Direito',
  side_skirt_left:    'Friso Lateral Esquerdo',
  side_skirt_right:   'Friso Lateral Direito',

  // Underbody / Mechanicals
  underbody:          'Chassi / Fundo',
  fuel_tank:          'Tanque de Combustível',
  exhaust:            'Escapamento',
};

export function partIdToLabel(partId) {
  if (!partId) return 'Peça desconhecida';
  if (PART_LABELS[partId]) return PART_LABELS[partId];
  // Fallback: replace underscores, capitalize each word
  return partId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── formatPercent ────────────────────────────────────────────────────────────
/**
 * Formats a decimal or percentage value.
 * Example: 78.4 → '78,4%'
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

// ─── severityLabel ────────────────────────────────────────────────────────────
/**
 * Converts an API severity key to a Portuguese display label.
 * @param {'low'|'medium'|'high'} severity
 * @returns {string}
 */
export function severityLabel(severity) {
  const map = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  return map[severity] ?? severity;
}

// ─── statusLabel ──────────────────────────────────────────────────────────────
/**
 * Converts a vehicle/damage status key to a Portuguese display label.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  const map = {
    available:      'Disponível',
    in_route:       'Em Rota',
    maintenance:    'Manutenção',
    open:           'Aberta',
    in_progress:    'Em Progresso',
    resolved:       'Resolvida',
  };
  return map[status] ?? status;
}
