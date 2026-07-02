// src/pages/Login.jsx
/**
 * Login Page — centered card with email + password form.
 * On success, redirects to /driver or /manager based on user role.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../services/authService.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Preencha o e-mail e a senha para continuar.');
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await login(email.trim(), password);

      toast.success(`Bem-vindo, ${user.name?.split(' ')[0] ?? 'usuário'}! 👋`);

      // Route by role
      const role = user.role?.toLowerCase();
      if (role === 'manager' || role === 'admin') {
        navigate('/manager', { replace: true });
      } else {
        navigate('/driver', { replace: true });
      }
    } catch (error) {
      toast.error(error.message ?? 'Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fiori-blue via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-7">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-gray-300 overflow-hidden">
            <img src="/favicon.jpg" alt="Drevo Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-fiori-gray tracking-tight">Drevo Móveis</h1>
            <p className="text-sm text-fiori-gray-mid mt-0.5">Gestão de Frotas</p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email / User */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-fiori-gray">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fiori-gray-mid">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu_usuario ou email@..."
                autoComplete="email"
                disabled={isLoading}
                className="input-base pl-10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-fiori-gray">
              Senha
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fiori-gray-mid">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="input-base pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fiori-gray-mid hover:text-fiori-gray"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center mt-2 py-3 text-base"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar no sistema'
            )}
          </button>
        </form>

        {/* ── Dev hint ── */}
        <div className="bg-fiori-gray-light rounded-xl p-3 text-center">
          <p className="text-xs text-fiori-gray-mid font-medium">Credenciais de demonstração</p>
          <p className="text-xs text-fiori-gray mt-1">
            Motorista: <span className="font-mono">pedro@drevomoveis.com.br</span> / <span className="font-mono">drevo123</span>
          </p>
          <p className="text-xs text-fiori-gray">
            Gestor: <span className="font-mono">mateus.moraes@drevomoveis.com.br</span> / <span className="font-mono">drevo123</span>
          </p>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-fiori-gray-mid">
          © {new Date().getFullYear()} Drevo Móveis · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
