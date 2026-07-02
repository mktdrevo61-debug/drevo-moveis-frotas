// src/pages/ManagerDashboard.jsx
/**
 * ManagerDashboard — desktop-first manager interface with sidebar navigation.
 *
 * Sections:
 *   - Dashboard  : KPI cards + charts (BarChart fuel costs + PieChart damage severity)
 *   - Frotas     : Vehicle fleet table with status badges
 *   - Avarias    : All damage records across the fleet
 */
import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Navbar from '../components/UI/Navbar.jsx';
import KPICard from '../components/UI/KPICard.jsx';
import LoadingSpinner from '../components/UI/LoadingSpinner.jsx';
import { getMetrics, getMockMetrics } from '../services/dashboardService.js';
import { getAllDamages } from '../services/damageService.js';
import { getAllFuelLogs } from '../services/fleetService.js';
import { formatCurrency, formatMileage, formatDate, partIdToLabel, severityLabel, formatPercent } from '../utils/formatters.js';
import toast from 'react-hot-toast';
import api from '../services/api.js';

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'fleet',
    label: 'Frotas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    id: 'damages',
    label: 'Avarias',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    id: 'fuel',
    label: 'Abastecimentos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
];

// Damage severity chart colors
const PIE_COLORS = ['#BB0000', '#E76500', '#C87B00'];

// Status badge component
function StatusBadge({ status }) {
  const cfg = {
    'Disponível':  'badge-green',
    'Em Rota':     'badge-gray',
    'Manutenção':  'badge-orange',
    'available':   'badge-green',
    'in_route':    'badge-gray',
    'maintenance': 'badge-orange',
  };
  const label = {
    'available':   'Disponível',
    'in_route':    'Em Rota',
    'maintenance': 'Manutenção',
  };
  const display = label[status] ?? status;
  return <span className={`${cfg[status] ?? 'badge-gray'}`}>{display}</span>;
}

// Custom tooltip for BarChart
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-fiori-border rounded-xl px-3 py-2 shadow-fiori text-sm">
      <p className="font-semibold text-fiori-gray">{label}</p>
      <p className="text-fiori-blue font-bold mt-0.5">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection({ metrics, loading }) {
  const kpis = [
    {
      title: 'OEE — Eficiência Global',
      value: loading ? '...' : `${(metrics?.oee ?? 0).toFixed(1)}%`,
      subtitle: 'Overall Equipment Effectiveness',
      color: 'text-fiori-blue',
      icon: '',
    },
    {
      title: 'Veículos em Rota',
      value: loading ? '...' : String(metrics?.vehicles_in_route ?? 0),
      subtitle: 'Frotas ativas agora',
      color: 'text-fiori-green',
      icon: '',
    },
    {
      title: 'Em Manutenção',
      value: loading ? '...' : String(metrics?.vehicles_in_maintenance ?? 0),
      subtitle: 'Aguardando reparo',
      color: 'text-fiori-orange',
      icon: '🔧',
    },
    {
      title: 'Gasto Mensal',
      value: loading ? '...' : formatCurrency(metrics?.monthly_cost ?? 0),
      subtitle: 'Combustível + Manutenção',
      color: 'text-fiori-red',
      icon: '',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fuel Cost Bar Chart */}
        <div className="card">
          <p className="section-title mb-4">Custo de Combustível (últimos 6 meses)</p>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <LoadingSpinner size="sm" label="" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={metrics?.fuel_by_month ?? []}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#89919A' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#89919A' }}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  width={54}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="cost" fill="#0070F2" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Damage Severity Pie Chart */}
        <div className="card">
          <p className="section-title mb-4">Distribuição de Avarias por Gravidade</p>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <LoadingSpinner size="sm" label="" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={metrics?.damage_by_severity ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(metrics?.damage_by_severity ?? []).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-fiori-gray">{value}</span>
                  )}
                />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #D9D9D9',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="card">
        <p className="section-title mb-4">Frota Atual</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fiori-border">
                {['Placa', 'Modelo', 'Status', 'Motorista'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-fiori-gray-mid uppercase tracking-wider py-2 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-fiori-gray-mid">
                    <LoadingSpinner size="sm" label="Carregando frota..." />
                  </td>
                </tr>
              ) : (
                (metrics?.vehicles ?? []).map((v) => (
                  <tr key={v.id} className="border-b border-fiori-border/50 hover:bg-fiori-gray-light/50 transition-colors">
                    <td className="py-3 pr-4 font-bold text-fiori-gray">{v.plate}</td>
                    <td className="py-3 pr-4 text-fiori-gray-mid">{v.model}</td>

                    <td className="py-3 pr-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3 pr-4 text-fiori-gray-mid">{v.current_driver_name ?? '—'}</td>
                  </tr>
                ))
              )}
              {!loading && (metrics?.vehicles ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-fiori-gray-mid">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Fleet Section ────────────────────────────────────────────────────────────
function FleetSection({ vehicles, loading }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="section-title mb-0">Gestão de Frotas</p>
        <span className="badge badge-gray">{vehicles.length} veículos</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fiori-border">
              {['#', 'Placa', 'Modelo', 'Status', 'Motorista', 'Destino', 'Ações'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-fiori-gray-mid uppercase tracking-wider py-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-10"><LoadingSpinner label="Carregando frota..." /></td></tr>
            ) : vehicles.map((v, i) => (
              <tr key={v.id} className="border-b border-fiori-border/50 hover:bg-fiori-gray-light transition-colors">
                <td className="py-3 pr-4 text-fiori-gray-mid text-xs">{i + 1}</td>
                <td className="py-3 pr-4 font-bold text-fiori-gray">{v.plate}</td>
                <td className="py-3 pr-4">{v.model}</td>

                <td className="py-3 pr-4"><StatusBadge status={v.status} /></td>
                <td className="py-3 pr-4 text-fiori-gray-mid">{v.current_driver_name ?? '—'}</td>
                <td className="py-3 pr-4 text-fiori-gray-mid font-medium">{v.current_destination ?? '—'}</td>
                <td className="py-3 pr-4">
                  <button className="text-fiori-blue hover:underline text-xs font-medium">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Damages Section ──────────────────────────────────────────────────────────
function DamagesSection() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDamages()
      .then((d) => setDamages(d ?? []))
      .catch(() => toast.error('Erro ao carregar avarias.'))
      .finally(() => setLoading(false));
  }, []);

  const [photoModalVehicle, setPhotoModalVehicle] = useState(null);

  const SEVERITY_CONFIG = {
    high:   { label: 'Alta',  badge: 'badge-red' },
    medium: { label: 'Média', badge: 'badge-orange' },
    low:    { label: 'Baixa', badge: 'badge-yellow' },
  };

  const STATUS_CONFIG = {
    open:        { label: 'Aberta',      badge: 'badge-red' },
    in_progress: { label: 'Em Progresso', badge: 'badge-orange' },
    resolved:    { label: 'Resolvida',   badge: 'badge-green' },
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="section-title mb-0">Avarias da Frota</p>
        <span className="badge badge-red">{damages.filter((d) => d.status === 'open').length} abertas</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fiori-border">
              {['Veículo', 'Peça', 'Gravidade', 'Status', 'Observações', 'Data', 'Foto'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-fiori-gray-mid uppercase tracking-wider py-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-10"><LoadingSpinner label="Carregando avarias..." /></td></tr>
            ) : damages.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-fiori-gray-mid">
                  <span className="text-4xl block mb-2"></span>
                  Nenhuma avaria registrada na frota.
                </td>
              </tr>
            ) : (
              damages.map((d, i) => (
                <tr key={d.id ?? i} className="border-b border-fiori-border/50 hover:bg-fiori-gray-light transition-colors">
                  <td className="py-3 pr-4 font-bold text-fiori-gray">{d.vehicle?.plate ?? `#${d.vehicle_id}`}</td>
                  <td className="py-3 pr-4">{partIdToLabel(d.part_id)}</td>
                  <td className="py-3 pr-4">
                    <span className={SEVERITY_CONFIG[d.severity]?.badge ?? 'badge-gray'}>
                      {SEVERITY_CONFIG[d.severity]?.label ?? d.severity}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={STATUS_CONFIG[d.status]?.badge ?? 'badge-gray'}>
                      {STATUS_CONFIG[d.status]?.label ?? d.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-fiori-gray-mid max-w-xs truncate">{d.notes || '—'}</td>
                  <td className="py-3 pr-4 text-fiori-gray-mid whitespace-nowrap">{formatDate(d.created_at, false)}</td>
                  <td className="py-3 pr-4">
                    {d.latest_photo ? (
                      <button
                        onClick={() => setPhotoModalVehicle(d.vehicle_id)}
                        className="text-fiori-blue hover:underline text-xs font-medium flex items-center gap-1"
                      >
                        Ver Fotos
                      </button>
                    ) : (
                      <span className="text-xs text-fiori-gray-mid">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {photoModalVehicle && (
        <PhotoModal
          vehicleId={photoModalVehicle}
          onClose={() => setPhotoModalVehicle(null)}
        />
      )}
    </div>
  );
}

// ─── Photo Modal ──────────────────────────────────────────────────────────────
function PhotoModal({ vehicleId, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/photos/vehicle/${vehicleId}`)
      .then(res => setPhotos(res.data.data.photos || []))
      .catch(err => toast.error('Erro ao carregar fotos'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta foto? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/photos/${id}`);
      setPhotos(photos.filter(p => p.id !== id));
      toast.success('Foto apagada com sucesso!');
    } catch (err) {
      toast.error('Erro ao apagar foto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-fiori-border flex items-center justify-between">
          <h3 className="font-bold text-fiori-gray">Fotos do Veículo #{vehicleId}</h3>
          <button onClick={onClose} className="p-2 hover:bg-fiori-gray-light rounded-full text-fiori-gray-mid">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-fiori-gray-light">
          {loading ? (
            <div className="py-10"><LoadingSpinner label="Carregando fotos..." /></div>
          ) : photos.length === 0 ? (
            <p className="text-center py-10 text-fiori-gray-mid">Nenhuma foto encontrada.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photos.map(p => (
                <div key={p.id} className="bg-white p-2 rounded-lg shadow-sm border border-fiori-border/50 relative group">
                  <div className="aspect-video relative rounded-md overflow-hidden bg-fiori-gray-light flex items-center justify-center">
                    <img src={p.photo_url} alt="Avaria" className="object-contain w-full h-full" loading="lazy" />
                  </div>
                  <div className="mt-2 text-xs text-fiori-gray-mid flex justify-between items-center">
                    <div>
                      <span className="block">{formatDate(p.created_at)}</span>
                      <span className="truncate font-medium">{p.driver_name}</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-fiori-red hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      title="Apagar Foto"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fuel Section ─────────────────────────────────────────────────────────────
function FuelSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFuelLogs()
      .then((data) => setLogs(data ?? []))
      .catch(() => toast.error('Erro ao carregar abastecimentos.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="section-title mb-0">Abastecimentos</p>
        <span className="badge badge-gray">{logs.length} registros</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fiori-border">
              {['Veículo', 'Motorista', 'Litros', 'Custo Total', 'Data', 'Nota Fiscal'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-fiori-gray-mid uppercase tracking-wider py-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10"><LoadingSpinner label="Carregando abastecimentos..." /></td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-fiori-gray-mid">
                  Nenhum abastecimento registrado.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-fiori-border/50 hover:bg-fiori-gray-light transition-colors">
                  <td className="py-3 pr-4 font-bold text-fiori-gray">{log.plate}</td>
                  <td className="py-3 pr-4 text-fiori-gray-mid">{log.driver_name}</td>
                  <td className="py-3 pr-4">{log.liters.toFixed(1)} L</td>
                  <td className="py-3 pr-4 text-fiori-blue font-semibold">{formatCurrency(log.total_cost)}</td>
                  <td className="py-3 pr-4 text-fiori-gray-mid whitespace-nowrap">{formatDate(log.created_at, false)}</td>
                  <td className="py-3 pr-4">
                    {log.receipt_image_url ? (
                      <a href={log.receipt_image_url} download={`Nota_${log.plate}_${log.id}.jpg`} target="_blank" rel="noreferrer" className="text-fiori-blue hover:underline text-xs font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Baixar Foto
                      </a>
                    ) : (
                      <span className="text-xs text-fiori-gray-mid">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ManagerDashboard ─────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadData() {
      getMetrics()
          .then((data) => setMetrics(data))
          .catch((error) => {
            console.error('Erro ao buscar métricas:', error);
            // Mostrar toast para avisar o usuário, mas evitar flood
            if (activeSection === 'dashboard' && !document.querySelector('.toast-metrics-error')) {
               toast.error('Não foi possível carregar os dados reais. Verifique a conexão com o servidor.', { id: 'metrics-error', className: 'toast-metrics-error' });
            }
          })
          .finally(() => setLoading(false));
    }

    loadData(); // Load immediately on mount

    // Auto-refresh every 10 seconds
    const intervalId = setInterval(loadData, 10000);
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-fiori-gray-light">
      <Navbar />

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* ── Sidebar ── */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-fiori-border min-h-full pt-6 hidden md:flex flex-col">
          <p className="text-[10px] font-bold text-fiori-gray-mid uppercase tracking-widest px-5 mb-3">
            Menu Principal
          </p>
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                  ${activeSection === item.id
                    ? 'bg-fiori-blue text-white shadow-sm'
                    : 'text-fiori-gray hover:bg-fiori-gray-light'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto px-5 py-5 border-t border-fiori-border">
            <p className="text-[10px] text-fiori-gray-mid leading-relaxed">
              Drevo Móveis v1.0<br />
              © {new Date().getFullYear()} — Todos os direitos reservados
            </p>
          </div>
        </aside>

        {/* ── Mobile tab bar (sm and below) ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-fiori-border z-30">
          <div className="flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold
                  ${activeSection === item.id ? 'text-fiori-blue' : 'text-fiori-gray-mid'}
                `}
              >
                <span className="scale-110">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-fiori-gray hidden md:block">
              {NAV_ITEMS.find(i => i.id === activeSection)?.label}
            </h2>
            <button
              onClick={async () => {
                try {
                  toast.loading('Gerando planilha...', { id: 'export_toast' });
                  const res = await api.get('/dashboard/export', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'drevo_frotas_relatorio.csv');
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode.removeChild(link);
                  toast.success('Planilha exportada com sucesso!', { id: 'export_toast' });
                } catch (err) {
                  toast.error('Erro ao exportar planilha.', { id: 'export_toast' });
                }
              }}
              className="ml-auto bg-fiori-green hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar Planilha
            </button>
          </div>

          {activeSection === 'dashboard' && (
            <DashboardSection metrics={metrics} loading={loading} />
          )}
          {activeSection === 'fleet' && (
            <FleetSection vehicles={metrics?.vehicles ?? []} loading={loading} />
          )}
          {activeSection === 'damages' && <DamagesSection />}
          {activeSection === 'fuel' && <FuelSection />}
        </main>
      </div>
    </div>
  );
}
