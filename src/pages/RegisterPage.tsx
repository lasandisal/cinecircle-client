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
import { uploadProfileImage } from '../services/supabase';
import { userService } from '../services/user.service';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'info' | 'otp'>('info');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/';
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) { setLocalError('Please enter your full name or handle.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setLocalError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setLocalError('Passwords do not match.'); return; }

    setSendingOtp(true);
    try {
      await authService.sendOtp(email.trim(), 'register');
      setStep('otp');
      setResendCooldown(45);
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Failed to send verification email. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    setLocalError(null);
    try {
      await authService.sendOtp(email.trim(), 'register');
      setResendCooldown(45);
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Could not resend code. Please wait a moment.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setLocalError('Please enter the complete 6-digit verification code.');
      return;
    }
    try {
      const result = await dispatch(
        registerUser({ name: name.trim(), email: email.trim(), password, otp: cleanOtp, bio: bio.trim() })
      );
      if (registerUser.fulfilled.match(result)) {
        if (profileImage) {
          try {
            const avatar = await uploadProfileImage(profileImage, result.payload.user._id);
            await userService.updateProfile({ avatar });
          } catch (uploadError) {
            console.error('Profile image upload failed after registration:', uploadError);
          }
        }
        navigate('/onboarding', { replace: true });
      }
    } catch { /* Handled via Redux state */ }
  };

  const displayError = localError || error;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      {/* Full-screen TV series collage background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Minimal top bar */}
      <header className="relative z-10 flex items-center px-8 sm:px-14 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="CineCircle" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
            Cine<span className="text-violet-400">Circle</span>
          </span>
        </Link>
      </header>

      {/* Two-column layout */}
      <div className="relative z-10 flex-1 flex items-center px-8 sm:px-14 py-8 gap-16">

        {/* Left — brand tagline */}
        <div className="hidden lg:flex flex-col gap-6 max-w-md">
          <div className="space-y-2">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest">
              Join the community
            </p>
            <h1 className="text-5xl font-black leading-[1.05] text-white font-['Outfit']">
              Your opinion<br />
              matters here.
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mt-3">
              Rate films, write reviews, build your watch history, and use
              group voting to settle the "what should we watch?" debate —
              with the people you watch with.
            </p>
          </div>
          <p className="text-xs text-slate-500 border-l-2 border-slate-700 pl-3 leading-relaxed">
            CineCircle is a <strong className="text-slate-400">social review platform</strong>, not a
            streaming service. We help you decide what to watch — not play it.
          </p>
        </div>

        {/* Right — register card */}
        <div className="w-full max-w-[400px] ml-auto lg:ml-0">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-8 py-9 shadow-2xl border border-white/8">

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                {step === 'info' ? 'Create your account' : 'Verify your email'}
              </h2>
              <p className="text-sm text-slate-400">
                {step === 'info'
                  ? 'Free forever. No credit card needed.'
                  : `Check your inbox at ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="mb-5 flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 'info'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
              }`}>
                {step === 'otp'
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">1</span>}
                Account Info
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 'otp'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  step === 'otp' ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'
                }`}>2</span>
                Verify Email
              </div>
            </div>

            {/* Error banner */}
            {displayError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{displayError}</span>
              </div>
            )}

            {/* Step 1 — Account information */}
            {step === 'info' && (
              <form className="space-y-3.5" onSubmit={handleProceedToOtp}>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Full name or handle"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Profile photo <span className="text-slate-500">(optional)</span></label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center shrink-0">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
                          setLocalError('Please choose an image file up to 5 MB.');
                          e.currentTarget.value = '';
                          return;
                        }
                        setLocalError(null);
                        setProfileImage(file);
                        setProfileImagePreview(URL.createObjectURL(file));
                      }}
                      className="min-w-0 flex-1 text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Bio <span className="text-slate-500">(optional)</span></label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={180}
                    rows={2}
                    placeholder="Tell the community about your film taste..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <p className="text-right text-[10px] text-slate-500">{bio.length} / 180</p>
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Email address"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Password (min. 6 characters)"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (displayError) { setLocalError(null); dispatch(clearError()); } }}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full mt-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-violet-700/40"
                >
                  {sendingOtp
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Code...</span></>
                    : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Step 2 — OTP verification */}
            {step === 'otp' && (
              <form
                className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
                onSubmit={handleVerifyAndRegister}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); if (displayError) setLocalError(null); }}
                  placeholder="------"
                  autoFocus
                  className="w-full py-3.5 px-4 bg-white/10 border-2 border-violet-500/50 focus:border-violet-400 rounded-2xl text-center text-2xl font-mono font-bold tracking-[0.4em] text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-violet-500/20 transition-all"
                />

                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <span className="text-xs text-slate-500">
                      Resend in <strong className="text-slate-300">{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={sendingOtp}
                      className="text-xs text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-violet-700/40"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Account...</span></>
                    : <><CheckCircle2 className="w-4 h-4" /><span>Verify &amp; Create Account</span></>}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('info'); setLocalError(null); }}
                  className="w-full text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change email address
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-white/8 text-center space-y-3">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" state={location.state} className="font-semibold text-white hover:text-violet-300 transition-colors">
                  Sign in
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
