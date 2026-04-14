import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, ChevronDown, Check, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SaaSTableProps = {
  columns: { key: string; label: string; width?: string }[];
  data: any[];
  onRowClick?: (row: any) => void;
  title?: string;
  description?: string;
};

export function SaaSTable({ columns, data, onRowClick, title, description }: SaaSTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredData = data.filter((row) => {
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(query));
  });

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pagedData = filteredData.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, data.length]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === pagedData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pagedData.map((_, i) => i.toString())));
    }
  };

  return (
    <div className="glass-effect rounded-2xl overflow-hidden flex flex-col w-full animate-in">
      {/* Header Area */}
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#121820] border border-white/5 rounded-xl px-3 py-2 text-sm focus-within:border-amber-500 transition-colors w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Filter specific row..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-full"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-[#121820] hover:bg-white/5 border border-white/5 rounded-xl text-sm font-semibold transition-colors">
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between text-amber-500 overflow-hidden"
          >
            <span className="text-sm font-bold">{selected.size} items selected</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-500/20 rounded-lg text-sm font-semibold transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-semibold transition-colors">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm font-bold text-slate-400 uppercase tracking-widest bg-[#121820]/50">
              <th className="p-4 w-12 text-center">
                <button 
                  onClick={toggleAll}
                  className={`w-4 h-4 rounded text-black flex items-center justify-center transition-colors ${selected.size === pagedData.length && pagedData.length > 0 ? 'bg-amber-500' : 'bg-slate-800 border border-white/10 hover:border-amber-500'}`}
                >
                  {selected.size === pagedData.length && pagedData.length > 0 && <Check className="w-3 h-3" />}
                </button>
              </th>
              {columns.map((col) => (
                <th key={col.key} className="p-4 whitespace-nowrap" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-300">
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="p-12 text-center text-slate-500">
                  No data available.
                </td>
              </tr>
            ) : (
              pagedData.map((row, idx) => {
                const isSelected = selected.has(idx.toString());
                return (
                  <tr 
                    key={idx} 
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-white/5 transition-colors cursor-pointer hover:bg-white/5 ${isSelected ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="p-4 text-center" onClick={(e) => { e.stopPropagation(); toggleSelect(idx.toString()); }}>
                      <button 
                        className={`w-4 h-4 rounded text-black flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500' : 'bg-slate-800 border border-white/10 hover:border-amber-500'}`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="p-4 font-medium whitespace-nowrap">
                        {row[col.key]}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-400 bg-[#121820]/50">
        <span>
          Showing {filteredData.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + pageSize, filteredData.length)} of {filteredData.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 hover:bg-slate-800 rounded-lg border border-white/5 transition-colors disabled:opacity-50"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </button>
          <span className="px-2 py-1 text-slate-300">Page {safePage} / {pageCount}</span>
          <button
            className="px-3 py-1 hover:bg-slate-800 rounded-lg border border-white/5 transition-colors disabled:opacity-50"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={safePage >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
