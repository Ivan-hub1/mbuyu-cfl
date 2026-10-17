import { useEffect, useState } from 'react';
import { fetchForexRates, SUPPORTED_CURRENCIES } from '../lib/forex';

export default function ForexWidget() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchForexRates()
      .then((data) => {
        if (cancelled) return;
        setRates(data.rates);
        setUpdatedAt(new Date(data.fetchedAt).toLocaleString());
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[forex widget]', err);
        setError('Rates unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-orange uppercase">
          💱 Live Exchange Rates
        </h3>
        <span className="text-xs text-gray-500">
          {loading ? '…' : updatedAt}
        </span>
      </div>

      {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

      {loading && !error && (
        <p className="text-gray-400 text-sm text-center py-4">Loading rates…</p>
      )}

      {!loading && rates && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {SUPPORTED_CURRENCIES.filter((c) => c !== 'UGX').map((code) => (
            <div
              key={code}
              className="bg-brand-black rounded-lg px-3 py-2 border border-brand-black-muted"
            >
              <p className="text-xs text-gray-500 mb-0.5">
                1 {code} =
              </p>
              <p className="text-brand-orange font-mono font-semibold">
                {rates[code]?.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}{' '}
                UGX
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Rates are indicative. Contact us for a firm quote.
      </p>
    </div>
  );
}