import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux';
import { loginUser, clearError } from '../store/slices/authSlice';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const redirectPath = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email: email.trim(), password }));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate(redirectPath, { replace: true });
      }
    } catch {
      // Handled via Redux state
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@cinecircle.test');
    setPassword('AdminPass123!');
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Glow backdrop card */}
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative text-center space-y-3 mb-6">
            <div className="inline-flex justify-center p-1 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-slate-700/60 shadow-lg shadow-indigo-500/10">
              <img
                src="/logo.png"
                alt="CineCircle Logo"
                className="w-14 h-14 rounded-xl object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
                Welcome back to <span className="text-indigo-400">CineCircle</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pick faster. Watch better. Decide together.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="relative mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form className="relative space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (displayError) {
                      setLocalError(null);
                      dispatch(clearError());
                    }
                  }}
                  placeholder="lasandi@cinecircle.test"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayError) {
                      setLocalError(null);
                      dispatch(clearError());
                    }
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div className="relative mt-5 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Admin Demo Credentials</span>
            </button>
          </div>

          {/* Footer Register Link */}
          <p className="relative text-center text-xs text-slate-400 mt-6">
            New to CineCircle?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline decoration-indigo-400/40 underline-offset-4 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
