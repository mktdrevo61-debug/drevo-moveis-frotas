// src/pages/DriverDashboard.jsx
/**
 * DriverDashboard — mobile-first driver interface with bottom tab navigation.
 *
 * Tabs:
 *   1. Entrega (Handover)   — vehicle selection + checkout/checkin
 *   2. Abastecimento        — fuel recording with OCR receipt simulation
 *   3. Inspeção 3D          — interactive 3D vehicle damage inspection
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/UI/Navbar.jsx';
import LoadingSpinner from '../components/UI/LoadingSpinner.jsx';
import {
  getVehicles,
  checkout,
  checkin,
  getActiveHandover,
  recordFuel,
} from '../services/fleetService.js';
import { uploadPhoto, getVehiclePhotos } from '../services/photoService.js';
import { getVehicleDamages, createDamage } from '../services/damageService.js';
import { formatCurrency, formatMileage, formatDate } from '../utils/formatters.js';

// ─── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'handover',  label: 'Entrega',    emoji: '' },
  { id: 'fuel',      label: 'Abastecer',  emoji: '' },
  { id: 'inspection',label: 'Fotos e Avarias', emoji: '' },
];

const FUEL_TYPES = [
  { value: 'diesel',    label: 'Diesel' },
  { value: 'gasoline',  label: 'Gasolina' },
  { value: 'ethanol',   label: 'Etanol' },
  { value: 'gas_cng',   label: 'GNV' },
];

// ─── Status Badge ──────────────────────────────────────────────────────────────
function VehicleStatusBadge({ status }) {
  const cfg = {
    'Disponível': 'badge-green',
    'Em Rota':    'badge-gray',
    'Manutenção': 'badge-orange',
  };
  return <span className={cfg[status] ?? 'badge-gray'}>{status}</span>;
}

// ─── Tab 1: Handover ──────────────────────────────────────────────────────────
function HandoverTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHandover, setActiveHandover] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startMileage, setStartMileage] = useState('');
  const [endMileage, setEndMileage] = useState('');
  const [destination, setDestination] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load vehicles and active handover on mount
  useEffect(() => {
    async function load() {
      try {
        const [vList, active] = await Promise.allSettled([
          getVehicles(),
          getActiveHandover(),
        ]);
        if (vList.status === 'fulfilled') setVehicles(vList.value ?? []);
        if (active.status === 'fulfilled') setActiveHandover(active.value);
      } catch {
        toast.error('Erro ao carregar veículos.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCheckout() {
    if (!selectedVehicle) return toast.error('Selecione um veículo.');
    if (!startMileage || isNaN(startMileage))
      return toast.error('Informe a quilometragem inicial.');
    if (!destination.trim())
      return toast.error('Informe o local de destino.');

    setSubmitting(true);
    try {
      const record = await checkout({
        vehicle_id: selectedVehicle.id,
        start_mileage: Number(startMileage),
        destination,
      });
      setActiveHandover(record);
      setSelectedVehicle(null);
      setStartMileage('');
      setDestination('');
      toast.success(`Veículo ${selectedVehicle.plate} retirado com sucesso!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckin() {
    if (!endMileage || isNaN(endMileage))
      return toast.error('Informe a quilometragem final.');
    if (Number(endMileage) < (activeHandover?.start_mileage ?? 0))
      return toast.error('KM final não pode ser menor que o inicial.');

    setSubmitting(true);
    try {
      await checkin({ end_mileage: Number(endMileage) });
      setActiveHandover(null);
      setEndMileage('');
      toast.success('Veículo devolvido com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Carregando veículos..." />;

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Active Handover Banner ── */}
      {activeHandover && (
        <div className="card border-l-4 border-fiori-green bg-green-50 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-fiori-green uppercase tracking-wider">Veículo em uso</p>
              <p className="text-lg font-bold text-fiori-gray mt-0.5">
                {activeHandover.plate ?? '—'}
              </p>
              <p className="text-sm text-fiori-gray-mid">
                {activeHandover.model} · Desde {formatDate(activeHandover.created_at)}
              </p>
              <p className="text-sm font-medium text-fiori-gray mt-1">
                KM inicial: {formatMileage(activeHandover.start_mileage)}
              </p>
              <p className="text-sm font-medium text-fiori-gray mt-0.5">
                Destino: {activeHandover.destination}
              </p>
            </div>
            {activeHandover.image_url && (
              <img src={activeHandover.image_url} alt={activeHandover.model} className="w-20 h-14 object-cover rounded shadow-sm border border-fiori-border shrink-0 ml-2" />
            )}
          </div>

          {/* Checkin form */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-fiori-gray">Devolver veículo</p>
            <input
              type="number"
              value={endMileage}
              onChange={(e) => setEndMileage(e.target.value)}
              placeholder="Quilometragem final (km)"
              className="input-base"
              min={activeHandover.start_mileage}
            />
            <button
              onClick={handleCheckin}
              disabled={submitting}
              className="btn-primary justify-center"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registrando...</>
              ) : (
                ' Confirmar Devolução'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Vehicle Selection ── */}
      {!activeHandover && (
        <>
          <div>
            <p className="section-title">Veículos Disponíveis</p>
            {vehicles.length === 0 ? (
              <div className="card text-center py-10 text-fiori-gray-mid">
                <span className="text-4xl block mb-2"></span>
                Nenhum veículo disponível no momento.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      if (v.status !== 'available') {
                        toast.error('Este veículo já está em uso.');
                        return;
                      }
                      setSelectedVehicle(v.id === selectedVehicle?.id ? null : v);
                    }}
                    className={`
                      card text-left flex flex-col justify-between transition-all duration-150
                      ${selectedVehicle?.id === v.id
                        ? 'ring-2 ring-fiori-blue border-fiori-blue bg-slate-50'
                        : v.status !== 'available' 
                          ? 'opacity-70 bg-gray-50'
                          : 'hover:shadow-fiori-md'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {v.image_url && (
                          <img src={v.image_url} alt={v.model} className="w-16 h-12 object-cover rounded shadow-sm border border-fiori-border" />
                        )}
                        <div>
                          <p className="font-bold text-fiori-gray text-base">{v.plate}</p>
                          <p className="text-sm text-fiori-gray-mid">{v.model}</p>
                        </div>
                      </div>
                      <VehicleStatusBadge status={v.status ?? 'Disponível'} />
                    </div>
                    {v.status === 'in_use' && v.current_driver_name && (
                      <div className="mt-3 text-xs bg-slate-200 text-slate-700 px-3 py-2 rounded-md">
                        <span className="font-semibold">Com:</span> {v.current_driver_name} 
                        {v.current_destination && <span> <br/> <span className="font-semibold">Indo para:</span> {v.current_destination}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Checkout Form ── */}
          {selectedVehicle && (
            <div className="card border-l-4 border-fiori-blue bg-slate-50 animate-slide-up flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-fiori-blue uppercase tracking-wider">Retirar veículo</p>
                <p className="text-lg font-bold text-fiori-gray mt-0.5">
                  {selectedVehicle.plate} — {selectedVehicle.model}
                </p>
              </div>
              <input
                type="number"
                value={startMileage}
                onChange={(e) => setStartMileage(e.target.value)}
                placeholder="Quilometragem inicial (km)"
                className="input-base"
                min={0}
              />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Local de destino"
                className="input-base"
              />
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="btn-primary justify-center"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirmando...</>
                ) : (
                  ' Confirmar Retirada'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab 2: Fuel ──────────────────────────────────────────────────────────────
function FuelTab({ vehicles }) {
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehicleId) return toast.error('Selecione o veículo.');
    if (!liters || isNaN(liters) || Number(liters) <= 0)
      return toast.error('Informe a quantidade em litros.');
    if (!cost || isNaN(cost) || Number(cost) <= 0)
      return toast.error('Informe o valor total.');
    if (!receiptImage)
      return toast.error('Tire uma foto da nota fiscal do abastecimento.');

    setSubmitting(true);
    try {
      await recordFuel({
        vehicle_id: vehicleId,
        liters: Number(liters),
        cost: Number(cost),
        fuel_type: 'gasoline', // Always gasoline as requested
        receipt_base64: receiptImage,
      });
      toast.success('Abastecimento registrado com sucesso!');
      setLiters('');
      setCost('');
      setReceiptImage(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6">
      <p className="section-title">Registrar Abastecimento (Gasolina)</p>

      {/* Vehicle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-fiori-gray">Veículo</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="input-base"
        >
          <option value="">Selecione o veículo...</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} — {v.model}
            </option>
          ))}
        </select>
      </div>

      {/* Liters + Cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fiori-gray">Litros</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            placeholder="0,0 L"
            className="input-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fiori-gray">Valor Total (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0,00"
            className="input-base"
          />
        </div>
      </div>

      {/* Receipt Photo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-fiori-gray">Foto da Nota Fiscal</label>
        {receiptImage ? (
          <div className="relative">
            <img src={receiptImage} alt="Nota Fiscal" className="w-full h-48 object-cover rounded-xl border border-fiori-border" />
            <button 
              type="button" 
              onClick={() => setReceiptImage(null)} 
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-fiori-border rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer hover:border-fiori-blue hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-fiori-gray-mid mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <span className="text-sm font-semibold text-fiori-gray">Tirar Foto da Nota</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </label>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary justify-center py-3"
      >
        {submitting ? (
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
        ) : (
          ' Registrar Abastecimento'
        )}
      </button>
    </form>
  );
}

function InspectionTab({ vehicles }) {
  const [vehicleId, setVehicleId] = useState('');
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photos, setPhotos] = useState([]);

  const [damages, setDamages] = useState([]);
  const [loadingDamages, setLoadingDamages] = useState(false);
  const [partId, setPartId] = useState('');
  const [severity, setSeverity] = useState('low');
  const [notes, setNotes] = useState('');
  const [submittingDamage, setSubmittingDamage] = useState(false);

  const handleSelectVehicle = useCallback(async (id) => {
    setVehicleId(id);
    if (!id) return;

    setLoadingPhotos(true);
    setLoadingDamages(true);
    try {
      const [dbPhotos, dbDamages] = await Promise.all([
        getVehiclePhotos(id).catch(() => []),
        getVehicleDamages(id).catch(() => [])
      ]);
      setPhotos(dbPhotos || []);
      setDamages(dbDamages || []);
    } catch {
      toast.error('Erro ao carregar dados do veículo.');
    } finally {
      setLoadingPhotos(false);
      setLoadingDamages(false);
    }
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!vehicleId) return toast.error('Selecione um veículo primeiro.');
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoUrl = event.target.result;
        try {
          const newPhoto = await uploadPhoto({ vehicle_id: vehicleId, photo_url: photoUrl });
          setPhotos(prev => [newPhoto, ...prev]);
          toast.success('Foto real salva com sucesso!');
        } catch {
          toast.error('Erro ao salvar foto no banco de dados.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) return toast.error('Selecione um veículo.');
    if (!partId) return toast.error('Descreva qual é a peça afetada.');
    
    setSubmittingDamage(true);
    try {
      const newDamage = await createDamage({
        vehicle_id: vehicleId,
        part_id: partId,
        severity,
        notes
      });
      setDamages(prev => [...prev, newDamage]);
      setPartId('');
      setNotes('');
      setSeverity('low');
      toast.success('Avaria registrada com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar avaria');
    } finally {
      setSubmittingDamage(false);
    }
  };

  const getSeverityLabel = (sev) => {
    switch (sev) {
      case 'low': return 'Leve';
      case 'medium': return 'Média';
      case 'high': return 'Grave';
      default: return sev;
    }
  };
  
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'low': return 'bg-fiori-yellow text-white';
      case 'medium': return 'bg-fiori-orange text-white';
      case 'high': return 'bg-fiori-red text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      <p className="section-title">Fotos e Avarias</p>

      {/* Vehicle selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-fiori-gray">Veículo</label>
        <select
          value={vehicleId}
          onChange={(e) => handleSelectVehicle(e.target.value)}
          className="input-base"
        >
          <option value="">Selecione o veículo...</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} — {v.model}
            </option>
          ))}
        </select>
      </div>

      {vehicleId ? (
        <>
          {/* Photos Section */}
          {loadingPhotos ? (
            <LoadingSpinner label="Carregando fotos do veículo..." />
          ) : (
            <div className="card mt-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-fiori-gray">Galeria de Fotos</p>
                <label className="bg-fiori-blue text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-fiori-blue-dark transition-colors">
                   Tirar Foto
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                </label>
              </div>
              
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img 
                        src={photo.photo_url} 
                        alt="Foto do veículo" 
                        className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded px-2 py-1 text-[10px] text-white truncate">
                        {formatDate(photo.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-fiori-gray-mid">Nenhuma foto salva para este veículo.</p>
                </div>
              )}
            </div>
          )}

          {/* Damages Form Section */}
          <form onSubmit={handleDamageSubmit} className="card bg-slate-50 animate-slide-up flex flex-col gap-4 mt-2">
            <p className="text-sm font-bold text-fiori-gray">Reportar Nova Avaria</p>
            
            <input
              type="text"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              placeholder="Qual é a peça/local do defeito? (ex: Para-choque)"
              className="input-base"
              required
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-fiori-gray-mid uppercase tracking-wide">Gravidade</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'low', label: 'Leve' },
                  { val: 'medium', label: 'Média' },
                  { val: 'high', label: 'Grave' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSeverity(opt.val)}
                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      severity === opt.val 
                        ? 'border-fiori-gray bg-fiori-gray text-white' 
                        : 'border-fiori-border bg-white text-fiori-gray hover:border-fiori-gray-mid'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              className="input-base h-20 resize-none"
            />

            <button type="submit" disabled={submittingDamage} className="btn-primary justify-center">
              {submittingDamage ? 'Salvando...' : 'Registrar Avaria'}
            </button>
          </form>

          {/* Damages List Section */}
          <div className="card mt-2">
            <p className="font-semibold text-fiori-gray mb-4">Avarias Registradas</p>
            {loadingDamages ? (
              <p className="text-sm text-fiori-gray-mid text-center">Carregando...</p>
            ) : damages.length > 0 ? (
              <div className="flex flex-col gap-3">
                {damages.map(d => (
                  <div key={d.id} className="p-3 border border-fiori-border rounded-xl flex flex-col gap-2 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fiori-gray capitalize">{d.part_id}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(d.severity)}`}>
                        {getSeverityLabel(d.severity)}
                      </span>
                    </div>
                    {d.notes && <p className="text-sm text-fiori-gray-mid bg-slate-50 p-2 rounded">{d.notes}</p>}
                    <p className="text-xs text-slate-400 text-right">{formatDate(d.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-fiori-gray-mid">Nenhuma avaria registrada.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-12 text-fiori-gray-mid">
          <p className="text-sm font-medium">Selecione um veículo para visualizar fotos e avarias.</p>
        </div>
      )}
    </div>
  );
}

// ─── DriverDashboard ──────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('handover');
  const [vehicles, setVehicles] = useState([]);

  // Fetch vehicles once (shared across tabs)
  useEffect(() => {
    getVehicles()
      .then((v) => setVehicles(v ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-fiori-gray-light">
      <Navbar />

      {/* Content area */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-24">
        {activeTab === 'handover'   && <HandoverTab />}
        {activeTab === 'fuel'       && <FuelTab vehicles={vehicles} />}
        {activeTab === 'inspection' && <InspectionTab vehicles={vehicles} />}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-fiori-border z-30 safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-colors
                ${activeTab === tab.id
                  ? 'text-fiori-blue'
                  : 'text-fiori-gray-mid hover:text-fiori-gray'
                }
              `}
            >
              {tab.emoji && <span className="text-xl leading-none">{tab.emoji}</span>}
              <span className="leading-tight">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 h-0.5 w-10 bg-fiori-blue rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
