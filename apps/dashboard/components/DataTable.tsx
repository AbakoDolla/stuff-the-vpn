'use client';
  import { useState, type ReactNode } from 'react';
  import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

  interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
    className?: string;
  }

  interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    pageSize?: number;
    emptyMessage?: string;
    actions?: (row: T) => ReactNode;
  }

  export default function DataTable<T extends Record<string, unknown>>({
    columns, data, loading, searchable, searchKeys, pageSize = 10, emptyMessage = 'Aucune donnée', actions
  }: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filtered = searchable && search
      ? data.filter(row => (searchKeys || Object.keys(row) as (keyof T)[]).some(k => String(row[k] ?? '').toLowerCase().includes(search.toLowerCase())))
      : data;

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="card p-0 overflow-hidden">
        {searchable && (
          <div className="p-4 border-b border-[#1E2D45]">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2D45]">
                {columns.map(col => (
                  <th key={String(col.key)} className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                ))}
                {actions && <th className="text-right px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D45]/50">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3"><div className="h-4 bg-[#1E2D45] rounded animate-pulse w-3/4" /></td>
                    ))}
                    {actions && <td className="px-4 py-3"><div className="h-4 bg-[#1E2D45] rounded animate-pulse w-16 ml-auto" /></td>}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-[#64748B]">{emptyMessage}</td></tr>
              ) : (
                paged.map((row, i) => (
                  <tr key={i} className="border-b border-[#1E2D45]/50 hover:bg-[#0F1629]/50 transition-colors">
                    {columns.map(col => (
                      <td key={String(col.key)} className={col.className || 'px-4 py-3 text-[#94A3B8]'}>
                        {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2D45]">
            <span className="text-xs text-[#64748B]">{filtered.length} résultats — Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-[#1E2D45] disabled:opacity-30 text-[#94A3B8]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-[#1E2D45] disabled:opacity-30 text-[#94A3B8]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }