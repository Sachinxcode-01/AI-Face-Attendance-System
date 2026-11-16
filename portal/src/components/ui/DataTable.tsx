'use client';

import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  rowKey: (row: T) => string;
  emptyTitle?: string;
}

export function DataTable<T>({
  columns,
  rows,
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  pageSize = 8,
  rowKey,
  emptyTitle = 'No records found',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let out = rows;
    if (search && onSearch) {
      const q = search.toLowerCase();
      out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const va = col.sortValue!(a);
          const vb = col.sortValue!(b);
          return sortDir === 'asc' ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
        });
      }
    }
    return out;
  }, [rows, search, onSearch, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div>
      {onSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => {
              onSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-xs text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-faint">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`pb-3 font-semibold ${c.sortable ? 'cursor-pointer select-none hover:text-hi' : ''}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  {c.header}
                  {sortKey === c.key && <span className="ml-1 text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="py-3.5">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <p className="py-8 text-center text-xs text-faint font-mono">{emptyTitle}</p>
        )}
      </div>
      {filtered.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-xs font-mono text-faint">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="chip-bytune h-7 px-3 text-[11px] disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="chip-bytune h-7 px-3 text-[11px] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
