import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { authService } from '../services/auth.service';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  // Handle send OTP for login
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setDevHint(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await authService.sendOtp(email.trim(), 'login');
      setOtpSent(true);
      setResendCooldown(45);
      if (res?.devCode) {
        setDevHint(res.devCode);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Could not send login code. Please check your email.';
      setLocalError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle verify OTP login
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!otp.trim() || otp.trim().length < 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email: email.trim(), otp: otp.trim() }));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate(redirectPath, { replace: true });
      }
    } catch {
      // Handled via Redux state
    }
  };

  const handleQuickDemo = () => {
    setAuthMode('password');
    setEmail('lasandisalwathura@gmail.com');
    setPassword('Password123!');
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
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

          {/* Mode Switcher Tabs */}
          <div className="relative mb-5 grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setLocalError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'password'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setLocalError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'otp'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Email OTP Sign-In
            </button>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="relative mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* MODE 1: Standard Password Login */}
          {authMode === 'password' && (
            <form className="relative space-y-4" onSubmit={handlePasswordSubmit}>
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
                    placeholder="lasandi@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('otp')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password? Use OTP
                  </button>
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
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
          )}

          {/* MODE 2: Passwordless Email OTP Login */}
          {authMode === 'otp' && (
            <div className="relative space-y-4 animate-in fade-in duration-200">
              {!otpSent ? (
                <form className="space-y-4" onSubmit={handleSendOtp}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (displayError) setLocalError(null);
                        }}
                        placeholder="lasandi@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      We'll send a 6-digit code to sign in instantly without a password.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Login Code...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send Login Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleOtpSubmit}>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <p className="text-xs text-slate-400">
                      Code sent to <span className="text-indigo-300 font-semibold">{email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                    >
                      Use another email
                    </button>
                    {devHint && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                        <div className="text-lg font-mono font-bold tracking-widest text-amber-400">
                          {devHint}
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtp(devHint)}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold"
                        >
                          Click to Auto-Fill Code
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, ''));
                        if (displayError) setLocalError(null);
                      }}
                      placeholder="------"
                      autoFocus
                      className="w-full py-3 px-4 bg-slate-950 border-2 border-indigo-500/50 rounded-xl text-center text-xl font-mono font-bold tracking-[0.4em] text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <span className="text-xs text-slate-500">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                        <span>Resend code</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Autofill button */}
          <div className="relative pt-2">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Admin Credentials (lasandisalwathura@gmail.com)</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="relative pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                state={location.state}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
