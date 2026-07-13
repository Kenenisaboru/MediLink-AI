'use strict';
'use client';

import React, { useState } from 'react';
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
  X
} from 'lucide-react';

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
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv-1', name: 'Paracetamol 500mg', quantity: 1200, price: 5.50, category: 'Analgesics', batchNumber: 'BTCH-PARA-001', expirationDate: '2027-06-15', status: 'IN_STOCK' },
    { id: 'inv-2', name: 'Amoxicillin 500mg Capsule', quantity: 450, price: 18.00, category: 'Antibiotics', batchNumber: 'BTCH-AMOX-092', expirationDate: '2027-03-20', status: 'IN_STOCK' },
    { id: 'inv-3', name: 'Metformin 850mg', quantity: 800, price: 12.00, category: 'Antidiabetics', batchNumber: 'BTCH-MET-850', expirationDate: '2027-09-01', status: 'IN_STOCK' },
    { id: 'inv-4', name: 'Ciprofloxacin 500mg', quantity: 35, price: 22.00, category: 'Antibiotics', batchNumber: 'BTCH-CIPRO-031', expirationDate: '2027-01-10', status: 'LOW_STOCK' },
    { id: 'inv-5', name: 'Expiring Pain Relief Syrup', quantity: 30, price: 45.00, category: 'Analgesics', batchNumber: 'BTCH-EXP-999', expirationDate: '2026-06-01', status: 'EXPIRED' },
    { id: 'inv-6', name: 'Amlodipine 5mg', quantity: 620, price: 8.50, category: 'Cardiovascular', batchNumber: 'BTCH-AML-005', expirationDate: '2028-02-28', status: 'IN_STOCK' },
    { id: 'inv-7', name: 'ORS Sachets', quantity: 15, price: 3.00, category: 'Rehydration', batchNumber: 'BTCH-ORS-112', expirationDate: '2027-04-15', status: 'LOW_STOCK' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '', quantity: '', price: '', category: 'Analgesics', batchNumber: '', expirationDate: ''
  });

  const categories = ['ALL', 'Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Rehydration'];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity || !newItem.price) return;

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newItem.name,
      quantity: parseInt(newItem.quantity),
      price: parseFloat(newItem.price),
      category: newItem.category,
      batchNumber: newItem.batchNumber || `BTCH-NEW-${Math.floor(Math.random() * 9000 + 1000)}`,
      expirationDate: newItem.expirationDate,
      status: parseInt(newItem.quantity) < 50 ? 'LOW_STOCK' : 'IN_STOCK',
    };

    setInventory([item, ...inventory]);
    setNewItem({ name: '', quantity: '', price: '', category: 'Analgesics', batchNumber: '', expirationDate: '' });
    setShowAddForm(false);
    showToast(`"${item.name}" added to inventory successfully.`);
  };

  const handleDelete = (id: string) => {
    const item = inventory.find(i => i.id === id);
    setInventory(inventory.filter(i => i.id !== id));
    showToast(`"${item?.name}" removed from inventory.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Pharmacy Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Kenema Pharmacy Branch No. 4</h1>
          <p className="text-xs opacity-70 mt-1">Piazza, Churchill Ave, Addis Ababa</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-lg flex items-center gap-2 transition hover-scale"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </button>
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
          <span className="text-2xl font-black">{totalValue.toLocaleString()} ETB</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Alerts</span>
          </div>
          <span className="text-2xl font-black text-rose-500">{expiringItems.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Inventory Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-teal-600" />
              Medicine Inventory
            </h2>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 opacity-50" />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700 text-sm"
                  placeholder="Search medicines or batch numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-200/20 text-[10px] uppercase tracking-wider opacity-60">
                    <th className="pb-3 pr-3">Medicine</th>
                    <th className="pb-3 pr-3">Category</th>
                    <th className="pb-3 pr-3">Qty</th>
                    <th className="pb-3 pr-3">Price (ETB)</th>
                    <th className="pb-3 pr-3">Expiry</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-500/5 transition">
                      <td className="py-3 pr-3">
                        <div>
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-[9px] opacity-50 block">{item.batchNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 opacity-75">{item.category}</td>
                      <td className="py-3 pr-3 font-bold">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 pr-3">{item.price.toFixed(2)}</td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          {new Date(item.expirationDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadge(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 opacity-60 text-sm">
                No medicines found matching your query.
              </div>
            )}
          </div>
        </div>

        {/* Expiry & Low Stock Alerts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-amber-500/10">
            <h2 className="font-extrabold text-base flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Expiry &amp; Stock Alerts
            </h2>

            <div className="space-y-3">
              {expiringItems.map((item) => (
                <div key={item.id} className={`p-3.5 rounded-xl border ${getStatusBadge(item.status)}`}>
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <div className="text-xs opacity-80 mt-1 space-y-0.5">
                    <p>Batch: {item.batchNumber}</p>
                    <p>Remaining: <strong>{item.quantity} units</strong></p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires: {new Date(item.expirationDate).toLocaleDateString()}
                    </p>
                  </div>
                  {item.status === 'EXPIRED' && (
                    <div className="mt-2 text-[10px] font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      EXPIRED — Must be recalled immediately
                    </div>
                  )}
                </div>
              ))}

              {expiringItems.length === 0 && (
                <div className="text-center py-8 opacity-60 text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  All medicines are within safe stock and expiry ranges.
                </div>
              )}
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-base flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-teal-600" />
              Recent Prescriptions
            </h2>
            <div className="space-y-3">
              {[
                { patient: 'Tewodros Assefa', medicine: 'Amlodipine 5mg', prescriber: 'Dr. Yonas Tariku', time: '2 hours ago' },
                { patient: 'Chaltu Olani', medicine: 'Paracetamol 500mg', prescriber: 'Dr. Chala Beyene', time: '5 hours ago' },
              ].map((rx, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-500/5 border border-slate-200/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{rx.patient}</strong>
                    <span className="opacity-50">{rx.time}</span>
                  </div>
                  <p className="opacity-80">Medicine: <strong>{rx.medicine}</strong></p>
                  <p className="opacity-60">Prescribed by {rx.prescriber}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl glass-card border border-white/20 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" /> Add Medicine to Inventory
              </h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full hover:bg-slate-200/30 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Medicine Name:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  placeholder="e.g. Amoxicillin 250mg"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Quantity:</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    placeholder="Units"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Price (ETB):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    placeholder="Per unit"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Category:</label>
                  <select
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {categories.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Expiration Date:</label>
                  <input
                    type="date"
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    value={newItem.expirationDate}
                    onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Batch Number (optional):</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                  placeholder="Auto-generated if blank"
                  value={newItem.batchNumber}
                  onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition hover-scale"
              >
                Add to Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
