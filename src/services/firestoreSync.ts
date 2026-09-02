import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { storage, ERPDataStore } from './storage';

export type CloudSyncStatus = 'initializing' | 'connected' | 'syncing' | 'synced' | 'error' | 'offline';

export interface CloudSyncInfo {
  status: CloudSyncStatus;
  lastSyncedAt: Date | null;
  error: string | null;
  projectId: string;
  databaseId: string;
  isCloudActive: boolean;
}

export interface FirestoreDailyMetrics {
  date: string; // YYYY-MM-DD
  readsCount: number;
  writesCount: number;
  deletesCount: number;
  bytesReceived: number; // Data viewed / retrieved
  bytesSent: number;     // Data written
  lastPayloadBytes: number;
  lastOperationAt: string | null;
}

export interface FirestoreQuotaCalculated {
  date: string;
  // Storage
  storageUsedBytes: number;
  storageUsedFormatted: string;
  storageTotalBytes: number;
  storageTotalFormatted: string;
  storageBalanceBytes: number;
  storageBalanceFormatted: string;
  storageUsedPercent: number;
  // Reads
  readsUsedToday: number;
  readsDailyLimit: number;
  readsBalanceToday: number;
  readsUsedPercent: number;
  // Writes
  writesUsedToday: number;
  writesDailyLimit: number;
  writesBalanceToday: number;
  writesUsedPercent: number;
  // Deletes
  deletesUsedToday: number;
  deletesDailyLimit: number;
  deletesBalanceToday: number;
  // Data Viewed / Transferred
  dataViewedBytes: number;
  dataViewedFormatted: string;
  dataWrittenBytes: number;
  dataWrittenFormatted: string;
  resetsIn: string;
  projectId: string;
  databaseId: string;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm)) + ' ' + sizes[safeI];
}

const STORAGE_METRICS_KEY = 'dreamdwell_firestore_metrics_v1';
const FIRESTORE_FREE_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GiB (1,073,741,824 bytes)
const FIRESTORE_FREE_DAILY_READS = 50000;
const FIRESTORE_FREE_DAILY_WRITES = 20000;
const FIRESTORE_FREE_DAILY_DELETES = 20000;

function sanitizeForFirestore(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)));
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

class FirestoreSyncService {
  private db: Firestore | null = null;
  private status: CloudSyncStatus = 'initializing';
  private lastSyncedAt: Date | null = null;
  private error: string | null = null;
  private statusListeners: Array<(info: CloudSyncInfo) => void> = [];
  private metricsListeners: Array<(metrics: FirestoreQuotaCalculated) => void> = [];
  private debounceTimer: any = null;
  private isApplyingRemoteUpdate = false;
  private isInitialized = false;
  private lastLocalPayloadHash: string = '';
  private metrics: FirestoreDailyMetrics;

  constructor() {
    this.metrics = this.loadMetrics();
    // Lazy or automatic initialization
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private loadMetrics(): FirestoreDailyMetrics {
    const today = getTodayKey();
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_METRICS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.date === today) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading Firestore metrics:', e);
      }
    }
    return {
      date: today,
      readsCount: 0,
      writesCount: 0,
      deletesCount: 0,
      bytesReceived: 0,
      bytesSent: 0,
      lastPayloadBytes: 0,
      lastOperationAt: null
    };
  }

  private saveMetrics() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(this.metrics));
      } catch (e) {
        console.error('Error saving Firestore metrics:', e);
      }
    }
    const calculated = this.getQuotaMetrics();
    this.metricsListeners.forEach(fn => fn(calculated));
  }

  public recordRead(approxBytes: number = 2048) {
    const today = getTodayKey();
    if (this.metrics.date !== today) {
      this.metrics = this.loadMetrics();
    }
    this.metrics.readsCount += 1;
    this.metrics.bytesReceived += approxBytes;
    this.metrics.lastOperationAt = new Date().toISOString();
    this.saveMetrics();
  }

  public recordWrite(approxBytes: number = 2048) {
    const today = getTodayKey();
    if (this.metrics.date !== today) {
      this.metrics = this.loadMetrics();
    }
    this.metrics.writesCount += 1;
    this.metrics.bytesSent += approxBytes;
    this.metrics.lastOperationAt = new Date().toISOString();
    this.saveMetrics();
  }

  public updatePayloadSize(data: any) {
    try {
      const json = JSON.stringify(data);
      const byteLength = new Blob([json]).size;
      this.metrics.lastPayloadBytes = byteLength;
      this.saveMetrics();
    } catch (e) {
      // fallback
    }
  }

  public getQuotaMetrics(): FirestoreQuotaCalculated {
    const today = getTodayKey();
    if (this.metrics.date !== today) {
      this.metrics = this.loadMetrics();
    }

    // Estimate payload size from current storage if not set yet
    let usedBytes = this.metrics.lastPayloadBytes;
    if (usedBytes === 0 && typeof window !== 'undefined') {
      try {
        const raw = storage.getRawData();
        usedBytes = new Blob([JSON.stringify(raw)]).size;
        this.metrics.lastPayloadBytes = usedBytes;
      } catch {
        usedBytes = 185000; // ~185 KB fallback
      }
    }

    const storageBalanceBytes = Math.max(0, FIRESTORE_FREE_STORAGE_BYTES - usedBytes);
    const storageUsedPercent = Number(((usedBytes / FIRESTORE_FREE_STORAGE_BYTES) * 100).toFixed(4));

    const readsBalance = Math.max(0, FIRESTORE_FREE_DAILY_READS - this.metrics.readsCount);
    const readsUsedPercent = Number(((this.metrics.readsCount / FIRESTORE_FREE_DAILY_READS) * 100).toFixed(2));

    const writesBalance = Math.max(0, FIRESTORE_FREE_DAILY_WRITES - this.metrics.writesCount);
    const writesUsedPercent = Number(((this.metrics.writesCount / FIRESTORE_FREE_DAILY_WRITES) * 100).toFixed(2));

    const deletesBalance = Math.max(0, FIRESTORE_FREE_DAILY_DELETES - this.metrics.deletesCount);

    // Calculate time until midnight UTC
    const now = new Date();
    const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const msUntilReset = Math.max(0, midnightUtc.getTime() - now.getTime());
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const mins = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    return {
      date: this.metrics.date,
      storageUsedBytes: usedBytes,
      storageUsedFormatted: formatBytes(usedBytes),
      storageTotalBytes: FIRESTORE_FREE_STORAGE_BYTES,
      storageTotalFormatted: '1,024 MB (1 GiB)',
      storageBalanceBytes,
      storageBalanceFormatted: formatBytes(storageBalanceBytes),
      storageUsedPercent,
      readsUsedToday: this.metrics.readsCount,
      readsDailyLimit: FIRESTORE_FREE_DAILY_READS,
      readsBalanceToday: readsBalance,
      readsUsedPercent,
      writesUsedToday: this.metrics.writesCount,
      writesDailyLimit: FIRESTORE_FREE_DAILY_WRITES,
      writesBalanceToday: writesBalance,
      writesUsedPercent,
      deletesUsedToday: this.metrics.deletesCount,
      deletesDailyLimit: FIRESTORE_FREE_DAILY_DELETES,
      deletesBalanceToday: deletesBalance,
      dataViewedBytes: this.metrics.bytesReceived,
      dataViewedFormatted: formatBytes(this.metrics.bytesReceived),
      dataWrittenBytes: this.metrics.bytesSent,
      dataWrittenFormatted: formatBytes(this.metrics.bytesSent),
      resetsIn: `${hours}h ${mins}m`,
      projectId: firebaseConfig.projectId || '',
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    };
  }

  public subscribeQuotaMetrics(fn: (metrics: FirestoreQuotaCalculated) => void) {
    this.metricsListeners.push(fn);
    fn(this.getQuotaMetrics());
    return () => {
      this.metricsListeners = this.metricsListeners.filter(l => l !== fn);
    };
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        this.updateStatus('error', 'Missing Firebase project credentials in configuration');
        return;
      }

      const app = !getApps().length
        ? initializeApp({
            apiKey: firebaseConfig.apiKey,
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
            messagingSenderId: firebaseConfig.messagingSenderId,
            appId: firebaseConfig.appId,
          })
        : getApp();

      this.db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
      this.updateStatus('connected');
      this.setupSync();
    } catch (err: any) {
      console.error('[FirestoreSync] Failed to initialize Firestore:', err);
      this.updateStatus('error', err?.message || 'Could not connect to Firebase Firestore');
    }
  }

  private async setupSync() {
    if (!this.db) return;
    const docRef = doc(this.db, 'erp_state', 'portfolio');

    try {
      // 1. Initial check: does cloud document already exist?
      const initialSnap = await getDoc(docRef);
      this.recordRead(initialSnap.exists() ? 5000 : 500);

      if (!initialSnap.exists()) {
        console.log('[FirestoreSync] Initializing empty Firestore database with local portfolio data...');
        await this.pushToCloud(storage.getRawData(), true);
      } else {
        const cloudDoc = initialSnap.data();
        if (cloudDoc && cloudDoc.data) {
          console.log('[FirestoreSync] Loaded existing cloud portfolio dataset from Firestore.');
          this.isApplyingRemoteUpdate = true;
          try {
            const raw = cloudDoc.data as ERPDataStore;
            storage.applyCloudData(raw);
            const str = JSON.stringify(raw);
            this.lastLocalPayloadHash = str;
            this.metrics.lastPayloadBytes = new Blob([str]).size;
            this.recordRead(this.metrics.lastPayloadBytes);
            this.lastSyncedAt = cloudDoc.updatedAt ? new Date(cloudDoc.updatedAt) : new Date();
            this.updateStatus('synced');
          } finally {
            this.isApplyingRemoteUpdate = false;
          }
        }
      }

      // 2. Real-time subscription for multi-tab, multi-device, and dev-to-published synchronization
      onSnapshot(
        docRef,
        (snapshot) => {
          if (!snapshot.exists()) return;
          const cloudDoc = snapshot.data();
          if (!cloudDoc || !cloudDoc.data) return;

          const cloudPayloadString = JSON.stringify(cloudDoc.data);
          const incomingSize = new Blob([cloudPayloadString]).size;
          this.recordRead(incomingSize);

          // Only apply if the data has actually changed from what we already have locally
          if (cloudPayloadString === this.lastLocalPayloadHash) {
            return;
          }

          if (this.isApplyingRemoteUpdate) return;

          console.log('[FirestoreSync] Incoming real-time cloud update from Firestore.');
          this.isApplyingRemoteUpdate = true;
          try {
            this.lastLocalPayloadHash = cloudPayloadString;
            this.metrics.lastPayloadBytes = incomingSize;
            storage.applyCloudData(cloudDoc.data as ERPDataStore);
            this.lastSyncedAt = cloudDoc.updatedAt ? new Date(cloudDoc.updatedAt) : new Date();
            this.updateStatus('synced');
            this.saveMetrics();
          } catch (e) {
            console.error('[FirestoreSync] Error applying incoming cloud data:', e);
          } finally {
            this.isApplyingRemoteUpdate = false;
          }
        },
        (err) => {
          console.warn('[FirestoreSync] Snapshot listener warning:', err);
          this.updateStatus('error', err.message);
        }
      );

      // 3. Listen to local storage changes to push to Firestore
      storage.subscribe(() => {
        if (this.isApplyingRemoteUpdate) return;

        const currentData = storage.getRawData();
        const currentHash = JSON.stringify(currentData);

        if (currentHash === this.lastLocalPayloadHash) {
          return;
        }

        this.schedulePush(currentData);
      });

    } catch (err: any) {
      console.error('[FirestoreSync] Setup error:', err);
      this.updateStatus('error', err?.message || 'Error configuring Firestore sync');
    }
  }

  private schedulePush(data: ERPDataStore) {
    this.updateStatus('syncing');
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.pushToCloud(data, false);
    }, 600);
  }

  public async pushToCloud(data: ERPDataStore, force: boolean = false): Promise<boolean> {
    if (!this.db) {
      this.updateStatus('offline', 'Database not connected');
      return false;
    }

    try {
      this.updateStatus('syncing');
      const docRef = doc(this.db, 'erp_state', 'portfolio');
      const sanitized = sanitizeForFirestore(data);
      const jsonStr = JSON.stringify(sanitized);
      const payloadBytes = new Blob([jsonStr]).size;

      const payload = {
        updatedAt: new Date().toISOString(),
        version: 1,
        source: typeof window !== 'undefined' ? window.location.origin : 'app',
        data: sanitized
      };

      await setDoc(docRef, payload, { merge: true });
      this.recordWrite(payloadBytes);
      this.metrics.lastPayloadBytes = payloadBytes;
      this.lastLocalPayloadHash = jsonStr;
      this.lastSyncedAt = new Date();
      this.error = null;
      this.updateStatus('synced');
      this.saveMetrics();
      return true;
    } catch (err: any) {
      console.error('[FirestoreSync] Cloud upload error:', err);
      this.updateStatus('error', err?.message || 'Failed to sync changes to Firestore');
      return false;
    }
  }

  public async forcePull(): Promise<boolean> {
    if (!this.db) return false;
    try {
      this.updateStatus('syncing');
      const docRef = doc(this.db, 'erp_state', 'portfolio');
      const snap = await getDoc(docRef);
      this.recordRead(snap.exists() ? 5000 : 500);

      if (snap.exists()) {
        const cloudDoc = snap.data();
        if (cloudDoc && cloudDoc.data) {
          this.isApplyingRemoteUpdate = true;
          try {
            const raw = cloudDoc.data as ERPDataStore;
            storage.applyCloudData(raw);
            const str = JSON.stringify(raw);
            this.lastLocalPayloadHash = str;
            this.metrics.lastPayloadBytes = new Blob([str]).size;
            this.lastSyncedAt = cloudDoc.updatedAt ? new Date(cloudDoc.updatedAt) : new Date();
            this.updateStatus('synced');
            this.saveMetrics();
            return true;
          } finally {
            this.isApplyingRemoteUpdate = false;
          }
        }
      }
      this.updateStatus('synced');
      return true;
    } catch (err: any) {
      this.updateStatus('error', err?.message || 'Failed to pull cloud data');
      return false;
    }
  }

  private updateStatus(status: CloudSyncStatus, errorMsg: string | null = null) {
    this.status = status;
    if (errorMsg !== null) this.error = errorMsg;
    if (status === 'synced') this.error = null;
    const info = this.getInfo();
    this.statusListeners.forEach((fn) => fn(info));
  }

  public getInfo(): CloudSyncInfo {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      error: this.error,
      projectId: firebaseConfig.projectId || '',
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      isCloudActive: !!this.db && this.status !== 'error'
    };
  }

  public subscribeStatus(fn: (info: CloudSyncInfo) => void) {
    this.statusListeners.push(fn);
    fn(this.getInfo());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== fn);
    };
  }
}

export const firestoreSync = new FirestoreSyncService();
