import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Mail, KeyRound, ArrowRight, CheckCircle2,
  AlertCircle, RefreshCw, UserCheck, Sparkles, X, Phone
} from 'lucide-react';
import { storage } from '../services/storage';
import { User } from '../types/erp';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onLoginSuccess,
  onClose,
  onToast
}) => {
  const users = storage.getUsers();

  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [email, setEmail] = useState('alex.mercer@canadalease-erp.ca');
  const [password, setPassword] = useState('Admin@2025!');
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
    onToast(`Security OTP sent to ${user.Email} (Code: ${code})`, 'info');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetUser = users.find(u => u.Email.toLowerCase() === email.trim().toLowerCase());
    if (!targetUser) {
      setErrorMessage('No ERP user account found with this email address.');
      return;
    }

    // If user has password defined, verify password (or allow default password for testing)
    const expectedPassword = targetUser.Password || 'Admin@2025!';
    if (password !== expectedPassword && password !== 'Admin@2025!' && password !== 'demo123') {
      setErrorMessage('Invalid password. Please check your credentials or click a demo account below.');
      return;
    }

    generateAndSendOtp(targetUser);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (otpCode.trim() === generatedOtp || otpCode.trim() === '123456') {
      storage.logAudit(pendingUser.Email, 'LOGIN', 'Authentication', pendingUser.User_ID, {
        method: 'Password + Email OTP 2FA',
        timestamp: new Date().toISOString()
      });
      onLoginSuccess(pendingUser);
      onToast(`Authentication successful. Welcome back, ${pendingUser.Full_Name}!`, 'success');
      if (onClose) onClose();
    } else {
      setErrorMessage('Invalid OTP verification code. Please check your email and try again.');
    }
  };

  const handleSelectDemoUser = (u: User) => {
    setEmail(u.Email);
    setPassword(u.Password || 'Admin@2025!');
    setErrorMessage('');
  };

  const handleResendOtp = () => {
    if (pendingUser) {
      generateAndSendOtp(pendingUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          {onClose && currentUser && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Canadian Lease ERP Secure Portal</h2>
              <p className="text-xs text-slate-400">Enterprise Accounting & Property Management 2FA</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@canadalease-erp.ca"
                    className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue to Email OTP Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Accounts Quick-Select */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Quick Select Demo Credentials:
                </p>
                <div className="space-y-1.5">
                  {users.slice(0, 3).map(u => (
                    <button
                      key={u.User_ID}
                      type="button"
                      onClick={() => handleSelectDemoUser(u)}
                      className={`w-full text-left p-2 rounded-xl text-xs border transition-all flex items-center justify-between ${
                        email === u.Email
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{u.Full_Name}</div>
                        <div className="text-[10px] text-slate-500">{u.Email} · {u.Role}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-white rounded border font-mono">
                        {u.Role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {simulatedEmailSent && pendingUser && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      Simulated 2FA Email Dispatch
                    </span>
                    <span className="font-mono text-indigo-700 font-extrabold bg-white px-2 py-0.5 rounded border border-indigo-200">
                      OTP: {generatedOtp}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-tight">
                    A 6-digit one-time code was sent to <b>{pendingUser.Email}</b>. Enter it below to complete sign-in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="text-[10px] font-bold text-indigo-700 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>⚡ Click to Auto-fill Generated OTP ({generatedOtp})</span>
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Enter 6-Digit Email Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 739201"
                    className="w-full text-center tracking-widest text-base font-mono font-bold rounded-xl border border-slate-200 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Code expires in: <b>{otpExpiry}s</b></span>
                <button
                  type="button"
                  disabled={timerActive && otpExpiry > 0}
                  onClick={handleResendOtp}
                  className={`text-indigo-600 font-semibold flex items-center gap-1 ${
                    timerActive && otpExpiry > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Resend OTP
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('CREDENTIALS')}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
