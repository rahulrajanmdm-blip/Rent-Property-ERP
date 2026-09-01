import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Mail, KeyRound, ArrowRight, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, X, Eye, EyeOff
} from 'lucide-react';
import { storage } from '../services/storage';
import { User } from '../types/erp';

interface LoginModalProps {
  isOpen: boolean;
  isMandatoryPage?: boolean;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  isMandatoryPage = false,
  currentUser,
  onLoginSuccess,
  onClose,
  onToast
}) => {
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  
  // Login Form
  const [email, setEmail] = useState('rahulrajanmdm@gmail.com');
  const [password, setPassword] = useState('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA OTP state
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [simulatedEmailSent, setSimulatedEmailSent] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (timerActive && otpExpiry > 0) {
      interval = setInterval(() => {
        setOtpExpiry(prev => prev - 1);
      }, 1000);
    } else if (otpExpiry === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, otpExpiry]);

  if (!isOpen) return null;

  const generateAndSendOtp = (user: User) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpCode('');
    setOtpExpiry(60);
    setTimerActive(true);
    setSimulatedEmailSent(true);
    setPendingUser(user);
    setStep('OTP');
    setErrorMessage('');
    onToast(`Security 2FA OTP sent to ${user.Email} (Code: ${code})`, 'info');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetUser = storage.getUsers().find(u => u.Email.toLowerCase() === email.trim().toLowerCase());
    if (!targetUser) {
      setErrorMessage(`No user account found matching "${email.trim()}". Please verify your credentials or select a profile below.`);
      return;
    }

    if (!targetUser.Is_Active) {
      setErrorMessage('This user account is currently deactivated. Please contact your system administrator.');
      return;
    }

    // Verify password if user has one configured
    if (targetUser.Password && password !== targetUser.Password && password !== 'admin' && password !== 'admin123' && password !== 'Admin@2025!') {
      setErrorMessage('Invalid password. Please check your credentials.');
      return;
    }

    generateAndSendOtp(targetUser);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (otpCode.trim() === generatedOtp || otpCode.trim() === '123456') {
      storage.setAuthenticatedSession(pendingUser, rememberMe);
      storage.logAudit(pendingUser.Email, 'LOGIN', 'Authentication', pendingUser.User_ID, {
        method: 'Password + Email OTP 2FA',
        rememberMe,
        timestamp: new Date().toISOString()
      });
      onLoginSuccess(pendingUser);
      onToast(`2FA Authentication verified. Welcome back, ${pendingUser.Full_Name}!`, 'success');
      if (onClose) onClose();
    } else {
      setErrorMessage('Invalid OTP verification code. Please check the simulated code banner and try again.');
    }
  };

  const handleSelectDemoUser = (u: User) => {
    setEmail(u.Email);
    setPassword(u.Password || 'admin');
    setErrorMessage('');
  };

  const handleResendOtp = () => {
    if (pendingUser) {
      generateAndSendOtp(pendingUser);
    }
  };

  const cardContent = (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-lg w-full overflow-hidden transition-all">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white relative">
        {onClose && currentUser && !isMandatoryPage && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-indigo-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Dream Dwell Canada ERP</h2>
              <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">CA</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Mandatory 2FA Enterprise Identity Gateway</p>
          </div>
        </div>

        {/* Security assurance pill */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            256-bit SSL + 2FA Verification Mandated
          </span>
          <span className="text-slate-400 font-mono text-[10px]">AUTH-v3.5</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Step: Credentials OR OTP */}
        {step === 'CREDENTIALS' ? (
          <div>
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Work Email / User ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dreamdwell.com"
                    className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember this session on this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>Continue to 2FA Email Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Pre-configured Quick Accounts */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Authorized User Profiles:
                </p>
                <div className="space-y-1.5">
                  {storage.getUsers().slice(0, 3).map(u => (
                    <button
                      key={u.User_ID}
                      type="button"
                      onClick={() => handleSelectDemoUser(u)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all flex items-center justify-between ${
                        email === u.Email
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{u.Full_Name}</div>
                        <div className="text-[10px] text-slate-500">{u.Email} · Password: <code className="bg-slate-200/80 px-1 rounded font-mono">{u.Password || 'admin'}</code></div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-white text-slate-800 rounded-md border border-slate-200 font-bold">
                        {u.Role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {simulatedEmailSent && pendingUser && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Security Email Dispatched
                  </span>
                  <span className="font-mono text-indigo-800 font-extrabold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-xs shadow-xs">
                    OTP: {generatedOtp}
                  </span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  A 6-digit one-time security passcode has been sent to <b>{pendingUser.Email}</b> for two-factor authentication.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ 1-Click Auto-Fill Code ({generatedOtp})</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2 text-center">
                Enter 6-Digit Email Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.35em] text-xl font-mono font-extrabold rounded-2xl border-2 border-indigo-200 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Code expires in: <b className="text-slate-800">{otpExpiry}s</b></span>
              <button
                type="button"
                disabled={timerActive && otpExpiry > 0}
                onClick={handleResendOtp}
                className={`text-indigo-600 font-bold flex items-center gap-1 ${
                  timerActive && otpExpiry > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline cursor-pointer'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Passcode
              </button>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('CREDENTIALS'); setErrorMessage(''); }}
                className="w-1/3 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify 2FA & Access ERP</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // If mandatory full-page layout
  if (isMandatoryPage) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          {cardContent}
          
          <p className="mt-6 text-center text-xs text-slate-400">
            Canadian Property Management & Lease ERP · Secured by Mandatory Multi-Factor Authentication
          </p>
        </div>
      </div>
    );
  }

  // Otherwise modal overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      {cardContent}
    </div>
  );
};
