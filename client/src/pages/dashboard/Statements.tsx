import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statementsApi } from '../../lib/statementsApi';
import type { CustomerSummaryRow } from '../../types/statements';

export default function Statements() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await statementsApi.listCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('[statements]', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      if (status === 403) {
        setError(
          'Access denied. Only administrators can view customer statements.'
        );
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(
          serverMsg || `Failed to load customers (${status || 'network error'}).`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: customers.length,
    withActivity: customers.filter(
      (c) => c.quoteCount > 0 || c.shipmentCount > 0
    ).length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Statements</h2>
          <p className="text-gray-400 text-sm mt-1">
            {stats.total} customers · {stats.withActivity} with activity
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-outline text-sm px-4 py-2"
        >
          {loading ? '↻ Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className="mb-6">
        <input
          className="input-field"
          placeholder="Search by name, email, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="card text-center py-8 mb-6">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={refresh} className="btn-outline text-sm">
            ↻ Try Again
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-400">
            {customers.length === 0
              ? 'No customers yet.'
              : 'No customers match your search.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-muted text-gray-400 text-left">
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium hidden md:table-cell">
                  Contact
                </th>
                <th className="p-4 font-medium hidden lg:table-cell">Since</th>
                <th className="p-4 font-medium">Activity</th>
                <th className="p-4 font-medium">Total Billed</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/statements/${encodeURIComponent(c.email)}`
                    )
                  }
                  className="border-b border-brand-black-muted last:border-0 hover:bg-brand-black/40 cursor-pointer transition"
                >
                  <td className="p-4">
                    <div className="font-medium text-white">{c.name}</div>
                    {c.companyName && (
                      <div className="text-xs text-gray-500">
                        {c.companyName}
                      </div>
                    )}
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-300 text-xs">
                    <div>{c.email}</div>
                    {c.phone && <div className="text-gray-500">{c.phone}</div>}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-xs">
                    <div className="text-gray-300">
                      {c.quoteCount} quote{c.quoteCount !== 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-500">
                      {c.shipmentCount} shipment
                      {c.shipmentCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-brand-orange font-semibold">
                      {c.currency} {c.totalBilled.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-brand-orange text-xs font-semibold whitespace-nowrap">
                      View →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}