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
        <div className="mb-3">
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => {
              onSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/5 text-gray-400">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`pb-3 font-semibold ${c.sortable ? 'cursor-pointer select-none hover:text-white' : ''}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  {c.header}
                  {sortKey === c.key && <span className="ml-1 text-indigo-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-white/[0.02]">
                {columns.map((c) => (
                  <td key={c.key} className="py-3">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-500">{emptyTitle}</p>
        )}
      </div>
      {filtered.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
