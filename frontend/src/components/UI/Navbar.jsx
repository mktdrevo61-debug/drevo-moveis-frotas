// src/components/UI/Navbar.jsx
/**
 * Navbar — top navigation bar for the Drevo Móveis app.
 * Adapts between driver and manager roles.
 *
 * Features:
 *  - Drevo logo + truck icon on the left
 *  - Role badge centered
 *  - User name + logout button on the right
 */
import { useNavigate } from 'react-router-dom';
import { useSnapshot } from 'valtio';
import toast from 'react-hot-toast';
import { authStore } from '../../store/authStore.js';
import { logout } from '../../services/authService.js';

// Role display labels in Portuguese
const ROLE_LABELS = {
  driver:  'Motorista',
  manager: 'Gestor',
  admin:   'Administrador',
};

const ROLE_COLORS = {
  driver:  'bg-gray-100 text-gray-800',
  manager: 'bg-gray-200 text-gray-900',
  admin:   'bg-gray-300 text-black',
};

export default function Navbar() {
  const snap = useSnapshot(authStore);
  const navigate = useNavigate();

  const role = snap.user?.role ?? 'driver';
  const name = snap.user?.name ?? 'Usuário';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    toast.success('Sessão encerrada com sucesso.');
    navigate('/login', { replace: true });
  }

  return (
    <header className="bg-black sticky top-0 z-40 shadow-md">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/favicon.jpg" alt="Drevo Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-lg leading-tight">Drevo Móveis</h1>
            <span className="text-gray-300 text-[10px] font-medium tracking-widest uppercase leading-tight">
              Gestão de Frotas
            </span>
          </div>
        </div>

        {/* ── Center: Role badge ─────────────────────────── */}
        <div className="flex-1 flex justify-center">
          {snap.isAuthenticated && (
            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                ${ROLE_COLORS[role] ?? 'bg-white/20 text-white'}
              `}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>

        {/* ── Right: User + Logout ───────────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle */}
          {snap.isAuthenticated && (
            <>
              <div
                className="w-8 h-8 rounded-full bg-white/20 text-white text-sm
                            font-semibold flex items-center justify-center flex-shrink-0"
                title={name}
              >
                {initials}
              </div>

              {/* Name (hidden on small screens) */}
              <span className="text-white text-sm font-medium hidden sm:block truncate max-w-[120px]">
                {name.split(' ')[0]}
              </span>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="
                  flex items-center gap-1.5 text-white/90 hover:text-white
                  bg-white/10 hover:bg-white/20 transition-colors
                  px-3 py-1.5 rounded-lg text-xs font-medium
                "
                title="Sair"
              >
                {/* Logout icon (heroicons outline) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
