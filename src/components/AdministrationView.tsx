import React, { useState, useRef } from 'react';
import {
  ShieldAlert, Users, Plus, Edit3, Trash2, Key, Check,
  X, CheckCircle2, AlertCircle, History, RotateCcw,
  Sparkles, Lock, Eye, CheckSquare, Square, Search,
  Database, Download, Upload, Trash, RefreshCw, FileText
} from 'lucide-react';
import { storage, ALL_ERP_TABS } from '../services/storage';
import { User, Role, AuditEntry } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdministrationViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchUser?: (user: User) => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  currentUser,
  onToast,
  onSwitchUser
}) => {
  const users = storage.getUsers();
  const auditLogs = storage.getAuditLogs();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const landlords = storage.getLandlords();
  const tenants = storage.getTenants();
  const leases = storage.getLeases();
  const rentTxns = storage.getRentTransactions();
  const journals = storage.getJournalHeaders();

  const isCleanSlate = properties.length === 0 && tenants.length === 0 && leases.length === 0;

  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'PERMISSIONS' | 'AUDIT' | 'STORAGE'>('USERS');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User>(users[0] || currentUser);
  const [auditSearch, setAuditSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<{
    User_ID: string;
    Email: string;
    Full_Name: string;
    Password: string;
    Phone: string;
    Role: Role;
    Is_Active: boolean;
    Assigned_Tabs: string[];
  }>({
    User_ID: '',
    Email: '',
    Full_Name: '',
    Password: '',
    Phone: '',
    Role: 'Operations',
    Is_Active: true,
    Assigned_Tabs: ['Dashboard', 'CollectionsBoard', 'Properties', 'Units', 'Tenants', 'Leases']
  });

  const handleOpenAdd = () => {
    const nextId = 'USR-' + String(users.length + 1).padStart(3, '0');
    setFormData({
      User_ID: nextId,
      Email: '',
      Full_Name: '',
      Password: 'admin',
      Phone: '',
      Role: 'Operations',
      Is_Active: true,
      Assigned_Tabs: ['Dashboard', 'CollectionsBoard', 'Properties', 'Units', 'Tenants', 'Leases', 'MoveIn', 'MoveOut']
    });
    setEditingUser(null);
    setShowAddUserModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      User_ID: user.User_ID,
      Email: user.Email,
      Full_Name: user.Full_Name,
      Password: user.Password || 'admin',
      Phone: user.Phone || '',
      Role: user.Role,
      Is_Active: user.Is_Active,
      Assigned_Tabs: user.Assigned_Tabs || ALL_ERP_TABS
    });
    setShowAddUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Email.trim() || !formData.Full_Name.trim()) {
      onToast('Please provide user email and full name', 'error');
      return;
    }

    const payload: User = {
      User_ID: formData.User_ID,
      Email: formData.Email.trim(),
      Full_Name: formData.Full_Name.trim(),
      Password: formData.Password.trim() || 'admin',
      Phone: formData.Phone.trim(),
      Role: formData.Role,
      Is_Active: formData.Is_Active,
      Created_At: editingUser ? editingUser.Created_At : new Date().toISOString().split('T')[0],
      TwoFactorSecret: editingUser?.TwoFactorSecret || 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
      EmergencyBackupCode: editingUser?.EmergencyBackupCode || '8492-3105',
      TwoFactorEnabled: true,
      TwoFactorMethod: 'TOTP_AUTHENTICATOR',
      Assigned_Tabs: formData.Role === 'Admin' ? [...ALL_ERP_TABS] : formData.Assigned_Tabs
    };

    if (editingUser) {
      storage.updateUser(payload, currentUser.Email);
      onToast(`User profile for ${payload.Full_Name} updated`, 'success');
    } else {
      storage.addUser(payload, currentUser.Email);
      onToast(`New user ${payload.Full_Name} created with ${payload.Role} permissions`, 'success');
    }
    setShowAddUserModal(false);
  };

  const handleDeleteUserConfirm = () => {
    if (!deletingUser) return;
    if (deletingUser.User_ID === currentUser.User_ID) {
      onToast('Cannot delete your own active user session', 'error');
      setDeletingUser(null);
      return;
    }
    storage.deleteUser(deletingUser.User_ID, currentUser.Email);
    onToast(`User ${deletingUser.Full_Name} deleted`, 'info');
    setDeletingUser(null);
  };

  const handleToggleTabPermission = (tabKey: string) => {
    if (selectedUserForPerms.Role === 'Admin') {
      onToast('Administrator role has universal access to all ERP modules.', 'info');
      return;
    }

    const currentTabs = selectedUserForPerms.Assigned_Tabs || [];
    let updatedTabs: string[];
    if (currentTabs.includes(tabKey)) {
      updatedTabs = currentTabs.filter(t => t !== tabKey);
    } else {
      updatedTabs = [...currentTabs, tabKey];
    }

    storage.updateUserTabs(selectedUserForPerms.User_ID, updatedTabs, currentUser.Email);
    setSelectedUserForPerms({ ...selectedUserForPerms, Assigned_Tabs: updatedTabs });
    onToast(`Updated tab permissions for ${selectedUserForPerms.Full_Name}`, 'success');
  };

  const handlePurgeAllData = () => {
    if (window.confirm('⚠️ PURGE ALL OPERATIONAL DATA?\n\nThis will remove all properties, units, landlords, tenants, leases, utility bills, rent transactions, and journal entries.\n\nYour user accounts, Chart of Accounts, and system configuration will remain intact. This cannot be undone.')) {
      storage.purgeAllSampleData(currentUser.Email);
      onToast('All sample & operational data purged! The database is now a clean production slate.', 'success');
    }
  };

  const handleLoadDemoData = () => {
    if (window.confirm('Load Canadian sample demonstration portfolio? This will populate sample properties in Ontario, BC, and Quebec with demo leases and accounting records.')) {
      storage.loadSampleDemoData(currentUser.Email);
      onToast('Sample demonstration portfolio loaded successfully!', 'success');
    }
  };

  const handleExportBackup = () => {
    const json = storage.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canadian-lease-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Database backup exported to JSON file', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importFromJSON(content, currentUser.Email);
        if (success) {
          onToast('Database successfully restored from JSON backup!', 'success');
        } else {
          onToast('Failed to import database. Please verify JSON file format.', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredAudit = auditLogs.filter(a => {
    const term = auditSearch.toLowerCase();
    return (
      a.Audit_ID.toLowerCase().includes(term) ||
      a.User_Email.toLowerCase().includes(term) ||
      a.Module.toLowerCase().includes(term) ||
      a.Action.toLowerCase().includes(term) ||
      a.Record_ID.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Access Control & Administration</h2>
                {isCleanSlate ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Clean Production Slate
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    Sample / Active Data ({properties.length} Props)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Manage user accounts, granular permissions, audit compliance logs, and database storage state</p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {!isCleanSlate && (
            <button
              onClick={handlePurgeAllData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5"
              title="Purge all operational data to clean production state"
            >
              <Trash className="w-3.5 h-3.5" />
              Purge Sample Data
            </button>
          )}

          {isCleanSlate && (
            <button
              onClick={handleLoadDemoData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5"
              title="Load Canadian sample demo portfolio"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Load Demo Data
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add User Account
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'USERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>User Directory ({users.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('PERMISSIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'PERMISSIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <span>Permissions Matrix</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'AUDIT'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Audit Trail Logs ({auditLogs.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('STORAGE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'STORAGE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>Storage & Sample Data</span>
          </div>
        </button>
      </div>

      {/* Subtab 1: User Accounts */}
      {activeSubTab === 'USERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => {
            const isCurrent = u.User_ID === currentUser.User_ID;

            return (
              <div
                key={u.User_ID}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 ${
                  isCurrent ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {u.Full_Name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{u.Full_Name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{u.Email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Assigned Role:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {u.Role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Accessible Modules:</span>
                    <span className="font-bold text-slate-800">
                      {u.Role === 'Admin' ? 'All (Universal Access)' : `${(u.Assigned_Tabs || []).length} Tabs`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className={`font-bold ${u.Is_Active ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {u.Is_Active ? 'Active & Enabled' : 'Suspended'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  {onSwitchUser && !isCurrent && (
                    <button
                      onClick={() => onSwitchUser(u)}
                      className="w-full py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Switch to Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedUserForPerms(u);
                      setActiveSubTab('PERMISSIONS');
                    }}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Configure Matrix
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 2: Permissions Matrix */}
      {activeSubTab === 'PERMISSIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module Access Control Matrix</h3>
              <p className="text-xs text-slate-500">Configure visible and accessible operational screens per user</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Configuring for:</span>
              <select
                value={selectedUserForPerms.User_ID}
                onChange={(e) => {
                  const target = users.find(u => u.User_ID === e.target.value);
                  if (target) setSelectedUserForPerms(target);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {users.map(u => (
                  <option key={u.User_ID} value={u.User_ID}>
                    {u.Full_Name} ({u.Role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedUserForPerms.Role === 'Admin' && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Full Administrator Access</p>
                <p className="text-indigo-700 mt-0.5">
                  Users with the <b>Admin</b> role automatically receive unrestricted access to all 19 ERP modules and accounting journals.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ALL_ERP_TABS.map(tab => {
              const isAllowed = selectedUserForPerms.Role === 'Admin' || (selectedUserForPerms.Assigned_Tabs || []).includes(tab);

              return (
                <div
                  key={tab}
                  onClick={() => handleToggleTabPermission(tab)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isAllowed
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold'
                      : 'bg-slate-50/60 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-xs">{tab}</span>
                  {isAllowed ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Audit Trail */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, module..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Audit ID & Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredAudit.map(log => (
                  <tr key={log.Audit_ID} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.Audit_ID}</p>
                      <span className="text-[10px] text-slate-400 font-sans">{new Date(log.Timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-700">
                      {log.User_Email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.Action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.Action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.Action === 'POST' ? 'bg-purple-100 text-purple-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {log.Action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-800">
                      {log.Module}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">
                      {log.Record_ID}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.IP_or_Source || 'Web ERP'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Storage & Sample Data Management */}
      {activeSubTab === 'STORAGE' && (
        <div className="space-y-6">
          {/* Status Alert Card */}
          <div className={`p-6 rounded-2xl border ${
            isCleanSlate
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${
                  isCleanSlate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">
                      {isCleanSlate ? 'Clean Production Workspace Active' : 'Active Operational & Sample Dataset'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isCleanSlate
                        ? 'bg-emerald-200/60 text-emerald-900'
                        : 'bg-amber-200/60 text-amber-900'
                    }`}>
                      {isCleanSlate ? 'READY FOR REAL DATA' : `${properties.length} PROPERTIES LOADED`}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-600">
                    {isCleanSlate
                      ? 'No operational records or sample data exist in this workspace. Any properties, landlords, tenants, or leases you create will be preserved in persistent browser storage.'
                      : 'Operational records and demo portfolio data are currently loaded. You can purge all sample data with one click to start fresh with a clean production slate.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isCleanSlate ? (
                  <button
                    onClick={handlePurgeAllData}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    Purge All Sample Data
                  </button>
                ) : (
                  <button
                    onClick={handleLoadDemoData}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Load Sample Demo Portfolio
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Database Entities Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Live Database Entity Counts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{properties.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Properties</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{units.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Units</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{landlords.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Landlords</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{tenants.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Tenants</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{leases.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Leases</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{rentTxns.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Rent Txns</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold text-slate-900">{journals.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Journals</div>
              </div>
            </div>
          </div>

          {/* Backup & Data Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backup Export */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Export JSON Backup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download a full snapshot of your current database including properties, tenants, leases, and accounting journals as a JSON file.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON Backup
              </button>
            </div>

            {/* Backup Import */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Restore / Import Database</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a previously exported JSON backup file to restore all ERP entities, user roles, and ledger journal history.
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  Select & Import JSON File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? `Edit User: ${editingUser.Full_Name}` : 'Create User Account'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.Full_Name}
                  onChange={(e) => setFormData({ ...formData, Full_Name: e.target.value })}
                  placeholder="e.g. Jordan Miller"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  placeholder="e.g. jordan.miller@dreamdwell.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Password *</label>
                  <input
                    type="password"
                    value={formData.Password}
                    onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    placeholder="(416) 555-0100"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={formData.Role}
                    onChange={(e) => setFormData({ ...formData, Role: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Admin">Admin (Superuser)</option>
                    <option value="Finance">Finance / Controller</option>
                    <option value="Operations">Operations Manager</option>
                    <option value="Auditor">Auditor (Read-Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.Is_Active ? 'Active' : 'Suspended'}
                    onChange={(e) => setFormData({ ...formData, Is_Active: e.target.value === 'Active' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUser}
        title="Delete User Account"
        itemName={deletingUser ? `${deletingUser.Full_Name} (${deletingUser.Email})` : ''}
        itemType="user account"
        warningMessage="Deleting this user will revoke their authentication access to this ERP instance."
        onConfirm={handleDeleteUserConfirm}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};
