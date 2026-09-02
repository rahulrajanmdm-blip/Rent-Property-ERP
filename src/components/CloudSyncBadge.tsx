import React, { useState, useEffect } from 'react';
import {
  Cloud, RefreshCw, AlertCircle, CheckCircle2, Shield,
  DownloadCloud, UploadCloud, X, HardDrive, Eye, Edit3,
  Sparkles, ExternalLink, Zap
} from 'lucide-react';
import { firestoreSync, CloudSyncInfo, FirestoreQuotaCalculated } from '../services/firestoreSync';
import { aiService, AiUsageMetrics } from '../services/aiService';

interface CloudSyncBadgeProps {
  onOpenQuota?: () => void;
}

export const CloudSyncBadge: React.FC<CloudSyncBadgeProps> = ({ onOpenQuota }) => {
  const [info, setInfo] = useState<CloudSyncInfo>(() => firestoreSync.getInfo());
  const [quota, setQuota] = useState<FirestoreQuotaCalculated>(() => firestoreSync.getQuotaMetrics());
  const [aiUsage, setAiUsage] = useState<AiUsageMetrics | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubStatus = firestoreSync.subscribeStatus((newInfo) => {
      setInfo(newInfo);
    });
    const unsubQuota = firestoreSync.subscribeQuotaMetrics((newQuota) => {
      setQuota(newQuota);
    });
    const unsubAi = aiService.subscribe((metrics) => {
      setAiUsage(metrics);
    });

    return () => {
      unsubStatus();
      unsubQuota();
      unsubAi();
    };
  }, []);

  const handleManualPush = async () => {
    setIsManualSyncing(true);
    setActionMessage('Uploading local database to Firebase Firestore...');
    try {
      const { storage } = await import('../services/storage');
      await firestoreSync.pushToCloud(storage.getRawData(), true);
      setActionMessage('Successfully synced to Firestore cloud!');
    } catch (e: any) {
      setActionMessage(`Upload failed: ${e.message}`);
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleManualPull = async () => {
    setIsManualSyncing(true);
    setActionMessage('Pulling latest dataset from Firebase Firestore...');
    try {
      await firestoreSync.forcePull();
      setActionMessage('Database updated with latest cloud records!');
    } catch (e: any) {
      setActionMessage(`Pull failed: ${e.message}`);
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const getStatusBadge = () => {
    switch (info.status) {
      case 'synced':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Cloud Synced</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span className="hidden md:inline">Syncing...</span>
          </span>
        );
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Cloud Ready</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer" title={info.error || 'Sync warning'}>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Cloud Issue</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Connecting...</span>
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Firebase Firestore & Gemini AI Quota Monitor"
        type="button"
      >
        {getStatusBadge()}
      </button>

      {/* Cloud Status Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cloud Persistence & Quota Balance</h3>
                  <p className="text-xs text-slate-500">Google Cloud Firestore & Gemini AI Free Tiers</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Status Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Live Dual-Environment Cloud Sync Active</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Data is synced to Google Firestore. Development & published versions share this database—republishing never loses your records.
                  </p>
                </div>
              </div>

              {/* LIVE QUOTAS & BALANCES SUMMARY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Quota Consumption (Daily Balance)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Resets in {quota.resetsIn}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Storage */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold mb-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Database Storage</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {quota.storageUsedFormatted}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      {quota.storageBalanceFormatted} left / 1 GB
                    </div>
                  </div>

                  {/* Reads */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Data Viewed / Reads</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {quota.readsUsedToday.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      {quota.readsBalanceToday.toLocaleString()} left / 50K
                    </div>
                  </div>

                  {/* Writes */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold mb-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Writes / Updates</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {quota.writesUsedToday.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      {quota.writesBalanceToday.toLocaleString()} left / 20K
                    </div>
                  </div>

                  {/* AI Key */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-violet-600 text-xs font-semibold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini AI Key</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {aiUsage ? aiUsage.requestsUsed.toLocaleString() : '0'} reqs
                    </div>
                    <div className="text-[11px] text-violet-600 font-medium mt-0.5">
                      {aiUsage ? aiUsage.balanceRequests.toLocaleString() : '1,500'} left / 1.5K
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Firebase Project:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{info.projectId}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Firestore Database ID:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]" title={info.databaseId}>
                    {info.databaseId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Last Synchronized:</span>
                  <span className="font-semibold text-slate-800">
                    {info.lastSyncedAt ? info.lastSyncedAt.toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {actionMessage && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-800 text-center animate-in fade-in">
                  {actionMessage}
                </div>
              )}

              {/* Manual Push / Pull Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleManualPush}
                  disabled={isManualSyncing}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Push to Cloud</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualPull}
                  disabled={isManualSyncing}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Pull from Cloud</span>
                </button>
              </div>

              {/* Open Full Quota & AI Monitor */}
              {onOpenQuota && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenQuota();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Open Full Storage & AI Quota Dashboard</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">Spark Free Tier: 100% Free</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

