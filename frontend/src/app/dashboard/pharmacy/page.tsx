'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Pill,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingDown,
  X,
  LogOut,
  Loader2,
  DollarSign,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  batchNumber: string;
  expirationDate: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRED';
}

export default function PharmacyDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('PHARMACY');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    quantity: '',
    price: '',
    category: 'Analgesics',
    batchNumber: '',
    expirationDate: ''
  });

  const categories = ['ALL', 'Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Rehydration'];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const { data } = await api.get('/pharmacy/inventory');
      
      const mappedData = data.map((item: any) => {
        const expDate = new Date(item.expirationDate);
        const today = new Date();
        let status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRED' = 'IN_STOCK';
        if (expDate <= today) {
          status = 'EXPIRED';
        } else if (item.quantity < 50) {
          status = 'LOW_STOCK';
        }
        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category || 'Analgesics',
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate.split('T')[0],
          status
        };
      });

      setInventory(mappedData);
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Failed to fetch inventory.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const filtered = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const expiringItems = inventory.filter((i) => i.status === 'EXPIRED' || i.status === 'LOW_STOCK');

  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.price), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXPIRED': return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      case 'LOW_STOCK': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity || !newItem.price || !newItem.expirationDate) {
      showToast('Name, quantity, price, and expiration date are required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        name: newItem.name,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price),
        expirationDate: new Date(newItem.expirationDate).toISOString(),
        batchNumber: newItem.batchNumber || `BTCH-${Math.floor(100000 + Math.random() * 900000)}`,
        category: newItem.category
      };

      if (newItem.id) {
        payload.id = newItem.id;
      }

      await api.post('/pharmacy/inventory', payload);
      await fetchData();

      setNewItem({ id: '', name: '', quantity: '', price: '', category: 'Analgesics', batchNumber: '', expirationDate: '' });
      setShowAddForm(false);
      showToast(payload.id ? 'Medicine updated successfully.' : 'Medicine added to inventory.');
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Pharmacy Stock Telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-float" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse-glow">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                MediLink Pharmacy Portal
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-500 block mt-[-4px]">
                Live Stock & Expiry Surveillance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewItem({ id: '', name: '', quantity: '', price: '', category: 'Analgesics', batchNumber: '', expirationDate: '' });
                setShowAddForm(true);
              }}
              className="px-4 py-2 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition hover-scale"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {toast && (
          <div className="p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            <span>{toast}</span>
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total SKUs Catalog', value: inventory.length, icon: Package, color: 'text-teal-500' },
            { label: 'Total Units Stocked', value: totalItems.toLocaleString(), icon: Pill, color: 'text-cyan-500' },
            { label: 'Portfolio Value (ETB)', value: `${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`, icon: TrendingDown, color: 'text-emerald-500' },
            { label: 'Expiries & Warnings', value: expiringItems.length, icon: AlertTriangle, color: 'text-rose-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 hover-scale flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <h4 className="text-2xl font-black">{value}</h4>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-slate-900/40 flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 animate-float" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inventory List & Search (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search & Category Filter */}
            <div className="glass-card-pro rounded-3xl p-4 border border-white/20 dark:border-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 opacity-60 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by medicine name or batch code..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
                      filterCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/80'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Table */}
            <div className="glass-card-pro rounded-3xl border border-white/20 dark:border-slate-800/20 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/40 dark:border-slate-800/40 text-[10px] font-black opacity-60 uppercase tracking-wider bg-slate-900/10">
                      <th className="p-4">Medicine Info</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Stock Level</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4">Expiry Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs font-semibold">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center opacity-60 font-semibold">
                          No medicines match your filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/5 dark:hover:bg-slate-900/40 transition">
                          <td className="p-4">
                            <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Batch: {item.batchNumber}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 font-bold text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{item.quantity}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(item.status)}`}>
                                {item.status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-black text-emerald-500">{item.price.toFixed(2)} ETB</td>
                          <td className="p-4 font-semibold text-slate-400">{item.expirationDate}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setNewItem({
                                  id: item.id,
                                  name: item.name,
                                  quantity: item.quantity.toString(),
                                  price: item.price.toString(),
                                  category: item.category,
                                  batchNumber: item.batchNumber,
                                  expirationDate: item.expirationDate
                                });
                                setShowAddForm(true);
                              }}
                              className="text-emerald-500 font-extrabold hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Expiration Warnings (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card-pro rounded-3xl p-6 border border-rose-500/30 space-y-4 shadow-xl">
              <h3 className="font-black text-base flex items-center gap-2 text-rose-500 tracking-tight">
                <ShieldAlert className="w-5 h-5 animate-pulse" /> Critical Expiry Warning Center
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Items requiring restock or quarantine due to passing expiry dates or falling below minimum thresholds.
              </p>
              
              <div className="space-y-3">
                {expiringItems.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-center text-xs font-bold text-emerald-500">
                    All inventory catalog items healthy.
                  </div>
                ) : (
                  expiringItems.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block font-bold">{item.name}</strong>
                        <span className="text-slate-400 text-[10px]">Expiry: {item.expirationDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusBadge(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Add / Edit Medicine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md glass-card-pro rounded-3xl border border-emerald-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black tracking-tight">{newItem.id ? 'Edit Medicine SKU' : 'Add New Medicine SKU'}</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <input
                type="text"
                placeholder="Medicine Name"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity Units"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Unit Price (ETB)"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>

              <select
                className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Batch Code (e.g. BTCH-1029)"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={newItem.batchNumber}
                onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Expiration Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                  value={newItem.expirationDate}
                  onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {newItem.id ? 'Save SKU Changes' : 'Commit to Inventory Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

