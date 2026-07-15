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
  Loader2
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
    id: '', // Empty means create, otherwise update
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

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const expiringItems = inventory.filter(i => i.status === 'EXPIRED' || i.status === 'LOW_STOCK');

  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.price), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXPIRED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'LOW_STOCK': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Pharmacy Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Pharmacy Inventory Dashboard</h1>
          <p className="text-xs opacity-70 mt-1">Live updates connected directly to system catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewItem({ id: '', name: '', quantity: '', price: '', category: 'Analgesics', batchNumber: '', expirationDate: '' });
              setShowAddForm(true);
            }}
            className="px-5 py-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-lg flex items-center gap-2 transition hover-scale"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-teal-600">
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total SKUs</span>
          </div>
          <span className="text-2xl font-black">{inventory.length}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-cyan-600">
            <Pill className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Units</span>
          </div>
          <span className="text-2xl font-black">{totalItems.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <TrendingDown className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Inventory Value</span>
          </div>
          <span className="text-2xl font-black">{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Warnings / Low Stock</span>
          </div>
          <span className="text-2xl font-black text-rose-500">{expiringItems.length}</span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Filters & Search */}
          <div className="p-4 rounded-2xl glass-card border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 opacity-60" />
              <input
                type="text"
                placeholder="Search by medicine name or batch number..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {categories.slice(0, 4).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                    filterCategory === cat ? 'bg-teal-700 text-white shadow-md' : 'bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/80'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl glass-card border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/20 text-xs font-extrabold opacity-60 uppercase tracking-wider bg-white/10">
                    <th className="p-4">Medicine Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock level</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/20 text-xs font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center opacity-60 font-semibold">
                        No medicines match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-sm">{item.name}</div>
                          <div className="text-[10px] opacity-60 mt-0.5">Batch: {item.batchNumber}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-800/50 font-bold">{item.category}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm">{item.quantity}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-extrabold">{item.price.toFixed(2)} ETB</td>
                        <td className="p-4 font-semibold">{item.expirationDate}</td>
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
                            className="text-teal-600 dark:text-teal-400 font-bold hover:underline mr-4"
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

        {/* Warning Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/20 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 text-rose-500">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              Critical Action Center
            </h3>
            <p className="text-xs opacity-75 leading-relaxed">
              These items require immediate inventory updates, either due to running low or passing expiration thresholds.
            </p>
            <div className="space-y-3">
              {expiringItems.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center text-xs font-semibold text-emerald-600">
                  All stock items healthy.
                </div>
              ) : (
                expiringItems.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/20 flex justify-between items-center text-xs">
                    <div>
                      <strong className="block font-bold">{item.name}</strong>
                      <span className="opacity-60 text-[10px]">Expiry: {item.expirationDate}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-white/20 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/30 pb-3">
              <h2 className="text-lg font-bold">{newItem.id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full hover:bg-slate-200/30 transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                placeholder="Medicine Name"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Price (ETB)"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>

              <select
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Batch Number (e.g. BTCH-1029)"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={newItem.batchNumber}
                onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
              />

              <div>
                <label className="text-[10px] font-bold opacity-60 mb-1 block pl-1">Expiration Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  value={newItem.expirationDate}
                  onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {newItem.id ? 'Save Changes' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
