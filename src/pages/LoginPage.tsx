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
  KeyRound,
  RefreshCw,
  Star,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { authService } from '../services/auth.service';

/** Three-word feature pills shown below the tagline */
const features = [
  { icon: Star, label: 'Rate & Review' },
  { icon: MessageSquare, label: 'Discuss Films' },
  { icon: Users, label: 'Decide Together' },
];

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

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const redirectPath = (location.state as any)?.from?.pathname || '/';

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) { setLocalError('Please enter your email address.'); return; }
    if (!password) { setLocalError('Please enter your password.'); return; }
    try {
      const result = await dispatch(loginUser({ email: email.trim(), password }));
      if (loginUser.fulfilled.match(result)) navigate(redirectPath, { replace: true });
    } catch { /* Handled via Redux state */ }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    setSendingOtp(true);
    try {
      await authService.sendOtp(email.trim(), 'login');
      setOtpSent(true);
      setResendCooldown(45);
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Could not send login code. Please check your email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!otp.trim() || otp.trim().length < 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }
    try {
      const result = await dispatch(loginUser({ email: email.trim(), otp: otp.trim() }));
      if (loginUser.fulfilled.match(result)) navigate(redirectPath, { replace: true });
    } catch { /* Handled via Redux state */ }
  };

  const displayError = localError || error;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      {/* Full-screen TV series collage background */}
      <div className="auth-background absolute inset-0 bg-cover bg-center" />
      {/* Layered gradients — heavy on the left so card stays readable */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Minimal top bar — logo only */}
      <header className="relative z-10 flex items-center px-8 sm:px-14 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="CineCircle" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
            Cine<span className="text-indigo-400">Circle</span>
          </span>
        </Link>
      </header>

      {/* Two-column layout: tagline left, card right */}
      <div className="relative z-10 flex-1 flex items-center px-8 sm:px-14 py-8 gap-16">

        {/* Left — brand tagline (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:flex flex-col gap-6 max-w-md">
          <div className="space-y-2">
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest">
              A film & TV review community
            </p>
            <h1 className="text-5xl font-black leading-[1.05] text-white font-['Outfit']">
              Stop scrolling.<br />
              Start deciding.
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mt-3">
              CineCircle is where you rate what you've watched, write honest reviews,
              and use group voting to finally settle the "what should we watch?" debate —
              with your friends.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">{label}</span>
              </div>
            ))}
          </div>

          {/* Not-streaming disclaimer */}
          <p className="text-xs text-slate-500 border-l-2 border-slate-700 pl-3 leading-relaxed">
            CineCircle does <strong className="text-slate-400">not</strong> stream any video.
            We're a social review platform — think Letterboxd meets group decision-making.
          </p>
        </div>

        {/* Right — auth card */}
        <div className="w-full max-w-[400px] ml-auto lg:ml-0">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-8 py-9 shadow-2xl border border-white/8">

            {/* Card header */}
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-slate-400">
                Sign in to your CineCircle account.
              </p>
            </div>

            {/* Mode tabs */}
            <div className="mb-5 grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('password'); setLocalError(null); }}
                className={`py-2 rounded-lg transition-all ${authMode === 'password' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setLocalError(null); }}
                className={`py-2 rounded-lg transition-all ${authMode === 'otp' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Email OTP
              </button>
            </div>

            {/* Error banner */}
            {displayError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{displayError}</span>
              </div>
            )}

            {/* Password login */}
            {authMode === 'password' && (
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Email address"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('otp'); setLocalError(null); }}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password? Use OTP →
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-700/40"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></>
                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* OTP login */}
            {authMode === 'otp' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {!otpSent ? (
                  <form className="space-y-4" onSubmit={handleSendOtp}>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (displayError) setLocalError(null); }}
                        placeholder="Registered email address"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500">We'll email you a 6-digit code — no password needed.</p>
                    <button
                      type="submit"
                      disabled={sendingOtp}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-700/40"
                    >
                      {sendingOtp
                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Code...</span></>
                        : <><KeyRound className="w-4 h-4" /><span>Send Login Code</span></>}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleOtpSubmit}>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center space-y-1">
                      <p className="text-xs text-slate-400">
                        Code sent to <span className="text-indigo-300 font-semibold">{email}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">Check your inbox and spam folder.</p>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Use a different email
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); if (displayError) setLocalError(null); }}
                      placeholder="------"
                      autoFocus
                      className="w-full py-3 px-4 bg-white/10 border-2 border-indigo-500/50 rounded-xl text-center text-xl font-mono font-bold tracking-[0.4em] text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />

                    <div className="text-center">
                      {resendCooldown > 0 ? (
                        <span className="text-xs text-slate-500">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp as any}
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
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-700/40"
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing In...</span></>
                        : <><span>Verify & Sign In</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-white/8 text-center space-y-3">
              <p className="text-sm text-slate-400">
                New to CineCircle?{' '}
                <Link to="/register" state={location.state} className="font-semibold text-white hover:text-indigo-300 transition-colors">
                  Create a free account
                </Link>
              </p>
              <p className="text-[11px] text-slate-600">
                🎬 CineCircle is a review &amp; decision community — we don't stream any video.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
