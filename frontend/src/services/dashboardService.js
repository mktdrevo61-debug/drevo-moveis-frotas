// src/services/dashboardService.js
/**
 * Dashboard metrics service — aggregated KPIs and analytics data.
 */
import api from './api.js';

// ─── getMetrics ───────────────────────────────────────────────────────────────
/**
 * Fetches all KPI metrics for the manager dashboard.
 * Returns:
 *   - oee: number (0-100, Overall Equipment Effectiveness %)
 *   - vehicles_in_route: number
 *   - vehicles_in_maintenance: number
 *   - monthly_cost: number (BRL)
 *   - fuel_by_month: Array<{ month: string, cost: number }>
 *   - damage_by_severity: Array<{ name: string, value: number }>
 *   - vehicles: Array<vehicle objects with status>
 * @returns {Promise<object>}
 */
export async function getMetrics() {
  const { data } = await api.get('/dashboard/metrics');
  return data.data;
}

// ─── getFleetStatus ───────────────────────────────────────────────────────────
/**
 * Fetches real-time fleet status summary.
 * @returns {Promise<object>}
 */
export async function getFleetStatus() {
  const { data } = await api.get('/dashboard/fleet-status');
  return data.data;
}

// ─── getDamageReport ──────────────────────────────────────────────────────────
/**
 * Fetches the damage analytics report.
 * @param {{ start_date?: string, end_date?: string }} dateRange
 * @returns {Promise<object>}
 */
export async function getDamageReport(dateRange = {}) {
  const { data } = await api.get('/dashboard/damage-report', { params: dateRange });
  return data.data;
}

// ─── getFuelReport ────────────────────────────────────────────────────────────
/**
 * Fetches fuel consumption analytics.
 * @param {{ months?: number }} options
 * @returns {Promise<Array>}
 */
export async function getFuelReport({ months = 6 } = {}) {
  const { data } = await api.get('/dashboard/fuel-report', { params: { months } });
  return data.data;
}

// ─── Mock data generator ──────────────────────────────────────────────────────
/**
 * Returns mock metrics for offline/demo mode.
 * Used as fallback when API is not available.
 * @returns {object}
 */
export function getMockMetrics() {
  return {
    oee: 78.4,
    vehicles_in_route: 12,
    vehicles_in_maintenance: 3,
    monthly_cost: 24850.0,
    fuel_by_month: [
      { month: 'Jan', cost: 18500 },
      { month: 'Fev', cost: 21200 },
      { month: 'Mar', cost: 19800 },
      { month: 'Abr', cost: 22400 },
      { month: 'Mai', cost: 20100 },
      { month: 'Jun', cost: 24850 },
    ],
    damage_by_severity: [
      { name: 'Crítica', value: 8 },
      { name: 'Média', value: 23 },
      { name: 'Baixa', value: 41 },
    ],
    vehicles: [
      { id: 1, plate: 'ABC-1234', model: 'VW Delivery 9.170', year: 2022, status: 'Em Rota', driver: 'Carlos Silva' },
      { id: 2, plate: 'DEF-5678', model: 'Mercedes Atego 1719', year: 2021, status: 'Disponível', driver: null },
      { id: 3, plate: 'GHI-9012', model: 'Ford Cargo 1317', year: 2020, status: 'Manutenção', driver: null },
      { id: 4, plate: 'JKL-3456', model: 'Iveco Daily 70C17', year: 2023, status: 'Em Rota', driver: 'Maria Fernanda' },
      { id: 5, plate: 'MNO-7890', model: 'Fiat Ducato Maxi', year: 2022, status: 'Disponível', driver: null },
    ],
  };
}
