import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux';
import { registerUser, clearError } from '../store/slices/authSlice';
import { authService } from '../services/auth.service';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'info' | 'otp'>('info');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & local feedback
  const [localError, setLocalError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/';
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

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

  // Step 1: Validate info and request email OTP
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setDevHint(null);

    if (!name.trim()) {
      setLocalError('Please enter your full name or nickname.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await authService.sendOtp(email.trim(), 'register');
      setStep('otp');
      setResendCooldown(45);
      if (res?.devCode) {
        setDevHint(res.devCode);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send verification email. Please try again.';
      setLocalError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    setLocalError(null);
    setDevHint(null);
    try {
      const res = await authService.sendOtp(email.trim(), 'register');
      setResendCooldown(45);
      if (res?.devCode) {
        setDevHint(res.devCode);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Could not resend code. Please wait a moment.';
      setLocalError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Submit OTP and register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setLocalError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      const resultAction = await dispatch(
        registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          otp: cleanOtp,
        })
      );

      if (registerUser.fulfilled.match(resultAction)) {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      // Handled via Redux state
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Glow backdrop card */}
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative text-center space-y-3 mb-6">
            <div className="inline-flex justify-center p-1 rounded-2xl bg-gradient-to-tr from-violet-500/20 via-purple-500/20 to-cyan-500/20 border border-slate-700/60 shadow-lg shadow-violet-500/10">
              <img
                src="/logo.png"
                alt="CineCircle Logo"
                className="w-14 h-14 rounded-xl object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
                Join <span className="text-violet-400">CineCircle</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {step === 'info'
                  ? 'Eliminate streaming decision paralysis with your friends'
                  : 'Verify your email to activate your account'}
              </p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="relative mb-6 flex items-center justify-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                step === 'info'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
              }`}
            >
              {step === 'otp' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
              )}
              <span>Account Info</span>
            </div>
            <div className="w-6 h-0.5 bg-slate-800"></div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                step === 'otp'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'bg-slate-950/40 text-slate-500 border border-slate-800/40'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  step === 'otp' ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </span>
              <span>Email Verification</span>
            </div>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="relative mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* STEP 1: Account Information */}
          {step === 'info' && (
            <form className="relative space-y-4" onSubmit={handleProceedToOtp}>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Handle
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (displayError) {
                        setLocalError(null);
                        dispatch(clearError());
                      }
                    }}
                    placeholder="Lasandi Salwathura"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We'll send a 6-digit verification code to this address.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
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
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (displayError) {
                        setLocalError(null);
                        dispatch(clearError());
                      }
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Continue to OTP Button */}
              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit Email OTP Verification */}
          {step === 'otp' && (
            <form className="relative space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleVerifyAndRegister}>
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 mx-auto flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Check your inbox</h3>
                <p className="text-xs text-slate-400">
                  We sent a 6-digit verification code to{' '}
                  <span className="text-violet-300 font-semibold">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('info');
                    setLocalError(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Change email address
                </button>
                {devHint && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1.5 animate-in fade-in duration-200">
                    <p className="text-[11px] font-semibold text-amber-300">
                      ⚡ Development Verification Code:
                    </p>
                    <div className="text-xl font-mono font-black tracking-widest text-amber-400">
                      {devHint}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(devHint)}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Click to Auto-Fill Code
                    </button>
                    <p className="text-[10px] text-slate-400">
                      💡 Tip: Also check your <span className="text-amber-300 font-semibold">Spam folder</span> or <span className="text-amber-300 font-semibold">Promotions tab</span> in Gmail.
                    </p>
                  </div>
                )}
                {!devHint && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    💡 Cannot find the email? Please check your <span className="text-violet-300 font-semibold">Spam / Junk</span> folder or <span className="text-violet-300 font-semibold">Promotions</span> tab.
                  </p>
                )}
              </div>

              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative max-w-[280px] mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtp(val);
                      if (displayError) setLocalError(null);
                    }}
                    placeholder="------"
                    autoFocus
                    className="w-full py-3.5 px-4 bg-slate-950 border-2 border-violet-500/50 focus:border-violet-400 rounded-2xl text-center text-2xl font-mono font-bold tracking-[0.4em] text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-violet-500/20 shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* Resend Code Link */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-slate-500 font-medium">
                    Resend code in <strong className="text-slate-300">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={sendingOtp}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="relative mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                state={location.state}
                className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
