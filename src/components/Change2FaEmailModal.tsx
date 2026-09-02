import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, AlertCircle, Check, X, ArrowRight, RefreshCw, KeyRound, Send, Server, CheckCircle2 } from 'lucide-react';
import { User } from '../types/erp';
import { storage } from '../services/storage';

interface Change2FaEmailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedUser: User) => void;
  initialTab?: 'RECIPIENT' | 'SENDER';
}

export const Change2FaEmailModal: React.FC<Change2FaEmailModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'RECIPIENT'
}) => {
  const currentOtpMail = user.TwoFactorOtpEmail?.trim() || user.Email;
  const [activeTab, setActiveTab] = useState<'RECIPIENT' | 'SENDER'>(initialTab);

  // Recipient state
  const [newEmail, setNewEmail] = useState(user.TwoFactorOtpEmail?.trim() || user.Email);
  const [updatePrimary, setUpdatePrimary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sender Gateway state (where OTP is sent FROM)
  const [smtpFrom, setSmtpFrom] = useState('Dream Dwell Security <no-reply@dreamdwell.com>');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [testTargetEmail, setTestTargetEmail] = useState(user.TwoFactorOtpEmail?.trim() || user.Email);
  const [isSavingSender, setIsSavingSender] = useState(false);
  const [isTestingSender, setIsTestingSender] = useState(false);

  // Load existing SMTP / Sender configuration
  useEffect(() => {
    fetch('/api/auth/smtp-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.from) setSmtpFrom(data.from);
        if (data.host) setSmtpHost(data.host);
        if (data.port) setSmtpPort(String(data.port));
        if (data.secure !== undefined) setSmtpSecure(Boolean(data.secure));
        if (data.user) setSmtpUser(data.user);
      })
      .catch((err) => console.warn('Could not load SMTP config in modal:', err));
  }, []);

  if (!isOpen) return null;

  const handleSaveRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    
    // Basic email validation
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid email address (e.g. user@example.com)' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      // 1. Update in StorageService (localStorage + /api/users + /api/auth/update-otp-email)
      const updated = storage.updateUser2FaEmail(user.User_ID, clean, updatePrimary, user.Email);

      if (!updated) {
        throw new Error('User record could not be located in local system.');
      }

      setStatusMessage({
        type: 'success',
        text: `2FA OTP destination email successfully changed to: ${clean}`
      });

      if (onSuccess) {
        onSuccess(updated);
      }

      // Auto close after brief display
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update 2FA OTP email address.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestPasscode = async () => {
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address first.' });
      return;
    }

    setIsSendingTest(true);
    setStatusMessage(null);

    try {
      // Temporarily update 2FA email in system so dispatch tests the new address
      storage.updateUser2FaEmail(user.User_ID, clean, updatePrimary, user.Email);

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: updatePrimary ? clean : user.Email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test OTP.');
      }

      setStatusMessage({
        type: 'success',
        text: `Test passcode generated & dispatched to ${clean}! (Passcode: ${data.fallbackCode || 'Sent'})`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Dispatch test failed: ${err.message}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpFrom.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a sender email address or header.' });
      return;
    }

    setIsSavingSender(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Sender Mail ID saved! Outgoing OTPs will now be sent from: ${data.from || smtpFrom}`
        });
      } else {
        throw new Error(data.error || 'Failed to save sender settings.');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error saving sender email: ${err.message}`
      });
    } finally {
      setIsSavingSender(false);
    }
  };

  const handleTestSenderDispatch = async () => {
    if (!testTargetEmail) {
      setStatusMessage({ type: 'error', text: 'Please enter a target recipient email for the test.' });
      return;
    }

    setIsTestingSender(true);
    setStatusMessage(null);

    try {
      // First save configuration
      await fetch('/api/auth/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom
        })
      });

      const res = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testTargetEmail })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Test email sent from "${smtpFrom}" to "${testTargetEmail}" successfully!`
        });
      } else {
        throw new Error(data.error || 'SMTP gateway failed to send email.');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Test dispatch error: ${err.message}`
      });
    } finally {
      setIsTestingSender(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="modal-change-2fa-email"
        className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                2FA OTP Email Configuration
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Security
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure where 2FA passcodes are sent from and delivered to
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('RECIPIENT');
              setStatusMessage(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'RECIPIENT'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Sent TO (Recipient)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('SENDER');
              setStatusMessage(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'SENDER'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sent FROM (Sender)</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: RECIPIENT (SENT TO) */}
        {activeTab === 'RECIPIENT' && (
          <div className="space-y-4 text-xs">
            {/* Current State Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold">User Account:</span>
                <span className="font-bold text-slate-900">{user.Full_Name} ({user.Role})</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold">Primary Login Email:</span>
                <span className="font-mono text-slate-800">{user.Email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200/60">
                <span className="font-semibold flex items-center gap-1.5 text-indigo-700">
                  <Mail className="w-3.5 h-3.5" />
                  Active 2FA OTP Recipient:
                </span>
                <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {currentOtpMail}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveRecipient} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Recipient 2FA Email Address (Where OTP is Sent TO) *
                </label>
                <input
                  id="input-new-2fa-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. your.personal@gmail.com"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  6-digit login verification codes and OTP alerts will be delivered directly to this inbox.
                </p>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updatePrimary}
                    onChange={(e) => setUpdatePrimary(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Also update primary account login email
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check this to use this address for logging in as well.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSendingTest || isSaving}
                  onClick={handleSendTestPasscode}
                  className="w-full sm:w-auto px-3.5 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                  {isSendingTest ? 'Sending Test...' : 'Send Test Passcode'}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Recipient Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: SENDER GATEWAY (SENT FROM) */}
        {activeTab === 'SENDER' && (
          <form onSubmit={handleSaveSender} className="space-y-4 text-xs">
            {/* Active Sender Card */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  Currently Sending OTPs From:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Outgoing
                </span>
              </div>
              <p className="font-mono text-indigo-900 font-semibold text-[11px] break-all">
                {smtpFrom}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Sender Mail ID & Name (Where OTP is Sent FROM) *</span>
                <span className="text-[10px] text-slate-500">"From:" Address</span>
              </label>
              <input
                type="text"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder="e.g. Dream Dwell Security <no-reply@dreamdwell.com> or yourname@gmail.com"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This is the sender email address displayed on incoming 2FA verification emails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">SMTP Server Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMTP User / Sending Email</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">App Password / Auth Key</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold text-xs">
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Use SSL/TLS (Port 465)</span>
              </label>
            </div>

            {/* Test Email Row */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                Test Outgoing Email Dispatch
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testTargetEmail}
                  onChange={(e) => setTestTargetEmail(e.target.value)}
                  placeholder="Recipient test email"
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  disabled={isTestingSender}
                  onClick={handleTestSenderDispatch}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSender ? 'animate-spin' : ''}`} />
                  <span>{isTestingSender ? 'Sending...' : 'Send Test'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSavingSender}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {isSavingSender ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving Sender...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Sender Mail ID
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

