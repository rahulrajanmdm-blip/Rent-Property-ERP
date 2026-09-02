import React, { useState, useEffect } from 'react';
import {
  Database, Sparkles, HardDrive, Eye, Edit3, Trash2,
  Clock, RefreshCw, ExternalLink, Zap, CheckCircle2,
  AlertTriangle, ShieldCheck, ArrowUpRight, Play, Server
} from 'lucide-react';
import { firestoreSync, FirestoreQuotaCalculated, formatBytes } from '../services/firestoreSync';
import { aiService, AiUsageMetrics } from '../services/aiService';
import { storage } from '../services/storage';

export const CloudQuotaMonitor: React.FC<{ onToast?: (msg: string, type: 'success' | 'error' | 'info') => void }> = ({ onToast }) => {
  const [firestoreQuota, setFirestoreQuota] = useState<FirestoreQuotaCalculated>(() => firestoreSync.getQuotaMetrics());
  const [aiUsage, setAiUsage] = useState<AiUsageMetrics | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Sandbox state
  const [selectedPreset, setSelectedPreset] = useState<string>('rent_reminder');
  const [customPrompt, setCustomPrompt] = useState<string>('Draft a professional, courteous rent reminder notice for an overdue rent of $2,400 due on the 1st of the month.');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [lastGenStats, setLastGenStats] = useState<{ tokens: number; model: string } | null>(null);

  useEffect(() => {
    const unsubFs = firestoreSync.subscribeQuotaMetrics((metrics) => {
      setFirestoreQuota(metrics);
    });

    const unsubAi = aiService.subscribe((metrics) => {
      setAiUsage(metrics);
    });

    return () => {
      unsubFs();
      unsubAi();
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      setFirestoreQuota(firestoreSync.getQuotaMetrics());
      await aiService.getUsage();
      onToast?.('Telemetry & usage metrics refreshed', 'info');
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    switch (preset) {
      case 'rent_reminder':
        setCustomPrompt('Draft a professional 7-day late rent payment notice for tenant Sarah Jenkins for Unit 302 ($2,450 CAD overdue), adhering to Canadian tenant communication standards.');
        break;
      case 'lease_clause':
        setCustomPrompt('Provide a legally clear Ontario Standard Lease clause summary explaining tenant rights regarding pet ownership and landlord restrictions.');
        break;
      case 'welcome_letter':
        setCustomPrompt('Generate a warm tenant welcome letter for a move-in at Dream Dwell Apartments including instructions for e-Transfer rent payment and 24/7 maintenance contact.');
        break;
      case 'ping_test':
        setCustomPrompt('Respond with "AI Key Active & Operational - Dream Dwell ERP Quota Verified" and current timestamp.');
        break;
      default:
        break;
    }
  };

  const handleRunAiTest = async () => {
    if (!customPrompt.trim()) return;
    setIsLoadingAi(true);
    setAiResult(null);

    try {
      const res = await aiService.runAssist(
        customPrompt,
        selectedPreset,
        'You are the intelligent lease administration assistant for Dream Dwell Property Management ERP in Canada.'
      );
      setAiResult(res.text);
      setLastGenStats({
        tokens: res.usage.totalTokens,
        model: res.model
      });
      onToast?.(`AI generated successfully! 1 request recorded. Balance left: ${res.quota.balanceRequests}`, 'success');
    } catch (err: any) {
      setAiResult(`Error generating response: ${err.message}`);
      onToast?.(err.message || 'AI generation failed', 'error');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Helper for progress bar color
  const getProgressColor = (percent: number) => {
    if (percent > 90) return 'bg-rose-500';
    if (percent > 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const rawData = storage.getRawData();
  const propertyCount = rawData.properties?.length || 0;
  const unitCount = rawData.units?.length || 0;
  const tenantCount = rawData.tenants?.length || 0;
  const leaseCount = rawData.leases?.length || 0;
  const paymentCount = rawData.rentTransactions?.length || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Service Details */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold tracking-tight">Live Storage & AI Quota Monitor</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Spark Free Tiers ($0/mo)
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Real-time measurement of Google Cloud Firestore operations, database storage payload, and Gemini AI key utilization.
              Quotas automatically reset every 24 hours at 00:00 UTC.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Daily Reset In</span>
              <span className="font-mono text-sm font-bold text-amber-300 flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                {firestoreQuota.resetsIn}
              </span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
              title="Refresh telemetry metrics"
              type="button"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Quota Grid: Storage, Reads, Writes, AI Key */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Firestore Database Storage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                1 GiB Free Plan
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Firestore Storage Used</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{firestoreQuota.storageUsedFormatted}</span>
              <span className="text-xs font-semibold text-slate-400">/ 1,024 MB</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(firestoreQuota.storageUsedPercent)}`}
                style={{ width: `${Math.max(0.5, Math.min(100, firestoreQuota.storageUsedPercent))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Balance Left:</span>
            <span className="font-bold text-emerald-600">{firestoreQuota.storageBalanceFormatted}</span>
          </div>
        </div>

        {/* 2. Firestore Document Reads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                50,000 / day
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reads Today (Data Viewed)</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{firestoreQuota.readsUsedToday.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-400">/ 50,000 reads</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(firestoreQuota.readsUsedPercent)}`}
                style={{ width: `${Math.max(0.5, Math.min(100, firestoreQuota.readsUsedPercent))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Balance Left Today:</span>
            <span className="font-bold text-emerald-600">{firestoreQuota.readsBalanceToday.toLocaleString()} reads</span>
          </div>
        </div>

        {/* 3. Firestore Document Writes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Edit3 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                20,000 / day
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Writes Today (Updates)</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{firestoreQuota.writesUsedToday.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-400">/ 20,000 writes</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(firestoreQuota.writesUsedPercent)}`}
                style={{ width: `${Math.max(0.5, Math.min(100, firestoreQuota.writesUsedPercent))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Balance Left Today:</span>
            <span className="font-bold text-emerald-600">{firestoreQuota.writesBalanceToday.toLocaleString()} writes</span>
          </div>
        </div>

        {/* 4. Gemini AI Key Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                1,500 / day
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Key Requests Today</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{aiUsage ? aiUsage.requestsUsed.toLocaleString() : '0'}</span>
              <span className="text-xs font-semibold text-slate-400">/ 1,500 RPD</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(aiUsage ? aiUsage.usedPercentage : 0)}`}
                style={{ width: `${Math.max(0.5, Math.min(100, aiUsage ? aiUsage.usedPercentage : 0))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Balance Left Today:</span>
            <span className="font-bold text-violet-600">
              {aiUsage ? aiUsage.balanceRequests.toLocaleString() : '1,500'} requests
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Technical Breakdown & AI Token Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Quota Specs & Data Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cloud Database Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Firestore Cloud Database Capacity Details</h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Database: <strong className="text-slate-800 font-mono text-[11px]">{firestoreQuota.databaseId}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Properties & Units</span>
                <span className="text-base font-extrabold text-slate-800">{propertyCount} props / {unitCount} units</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Active Leases</span>
                <span className="text-base font-extrabold text-slate-800">{leaseCount} leases</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Tenants Registered</span>
                <span className="text-base font-extrabold text-slate-800">{tenantCount} tenants</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="text-slate-500 text-[11px] block">Rent & Accounting Txns</span>
                <span className="text-base font-extrabold text-slate-800">{paymentCount} records</span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-950 font-semibold">
                <span>Free Tier Limit Specifications:</span>
                <span className="text-indigo-600 font-bold">Google Cloud Spark Plan ($0.00 / mo)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-indigo-800">
                <div>• Storage: <strong>1 GiB total stored data</strong></div>
                <div>• Daily Document Reads: <strong>50,000 / day</strong></div>
                <div>• Daily Document Writes: <strong>20,000 / day</strong></div>
                <div>• Daily Document Deletes: <strong>20,000 / day</strong></div>
                <div>• Network Egress: <strong>10 GiB / month</strong></div>
                <div>• Simultaneous Connections: <strong>100 active clients</strong></div>
              </div>
            </div>
          </div>

          {/* AI Key Specifications & Token Consumption */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Gemini AI Key Rate Limits & Token Analytics</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Active Key Attached
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-100">
                <span className="text-violet-700 text-[11px] font-medium block">Daily Request Rate (RPD)</span>
                <span className="text-lg font-black text-violet-950 mt-0.5 block">1,500 requests / day</span>
                <span className="text-[10px] text-violet-600 mt-1 block">
                  Remaining today: <strong>{aiUsage ? aiUsage.balanceRequests : 1500}</strong>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-100">
                <span className="text-violet-700 text-[11px] font-medium block">Per-Minute Rate (RPM)</span>
                <span className="text-lg font-black text-violet-950 mt-0.5 block">15 requests / min</span>
                <span className="text-[10px] text-violet-600 mt-1 block">Burst concurrency throttle</span>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-100">
                <span className="text-violet-700 text-[11px] font-medium block">Token Rate (TPM)</span>
                <span className="text-lg font-black text-violet-950 mt-0.5 block">1,000,000 tokens / min</span>
                <span className="text-[10px] text-violet-600 mt-1 block">
                  Used today: <strong>{aiUsage ? aiUsage.totalTokens.toLocaleString() : 0} tokens</strong>
                </span>
              </div>
            </div>

            {/* Verification Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <a
                href={`https://console.firebase.google.com/project/${firestoreQuota.projectId}/firestore/usage`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>View Firebase Console Usage Graphs</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Google AI Studio API Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Col: Live AI Key Quota Tester & Assistant */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Live AI Assistant & Quota Tester</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Test your AI Key directly. Submitting a prompt decrements the balance by 1 request in real time.
            </p>

            {/* Presets */}
            <div className="space-y-2 mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Select Test Task / Template
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'rent_reminder', label: 'Late Rent Notice' },
                  { id: 'lease_clause', label: 'Lease Clause Summary' },
                  { id: 'welcome_letter', label: 'Welcome Letter' },
                  { id: 'ping_test', label: 'Fast Health Ping' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePresetChange(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                      selectedPreset === item.id
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-1.5 mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Prompt to Gemini AI
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-sans"
                placeholder="Enter prompt for Gemini AI..."
              />
            </div>

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunAiTest}
              disabled={isLoadingAi || !customPrompt.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {isLoadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating via Gemini...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run AI Generation (Costs 1 Request)</span>
                </>
              )}
            </button>
          </div>

          {/* AI Output Window */}
          {aiResult && (
            <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-2 border border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5 text-slate-400">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Generated Output
                </span>
                {lastGenStats && (
                  <span className="font-mono text-[10px]">
                    {lastGenStats.tokens} tokens ({lastGenStats.model})
                  </span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-200 text-[11px]">
                {aiResult}
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-500 text-center">
            Daily limit: 1,500 requests • Free Tier • Refreshes daily at 00:00 UTC
          </div>
        </div>
      </div>
    </div>
  );
};
