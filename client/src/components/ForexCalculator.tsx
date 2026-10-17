import { useEffect, useState } from 'react';
import {
  fetchForexRates,
  convert,
  formatMoney,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from '../lib/forex';

export default function ForexCalculator() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<CurrencyCode>('USD');
  const [to, setTo] = useState<CurrencyCode>('UGX');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchForexRates()
      .then((data) => {
        if (!cancelled) setRates(data.rates);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[forex calc]', err);
          setError('Rates unavailable — try again later');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const numericAmount = parseFloat(amount) || 0;
  const result =
    rates && !isNaN(numericAmount)
      ? convert(numericAmount, from, to, rates)
      : 0;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
        🧮 Currency Calculator
      </h3>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {/* FROM */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field flex-1"
              placeholder="Enter amount"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as CurrencyCode)}
              className="input-field w-28"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SWAP */}
        <div className="flex justify-center">
          <button
            onClick={swap}
            className="px-4 py-1.5 rounded-lg bg-brand-orange/15 text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/25 text-sm font-medium transition"
            type="button"
          >
            ⇅ Swap
          </button>
        </div>

        {/* TO */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">To</label>
          <div className="flex gap-2">
            <div className="input-field flex-1 flex items-center text-brand-orange font-mono font-semibold">
              {loading ? '…' : formatMoney(result, to)}
            </div>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as CurrencyCode)}
              className="input-field w-28"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate hint */}
        {rates && !loading && (
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-brand-black-muted">
            1 {from} ={' '}
            <span className="text-brand-orange">
              {formatMoney(convert(1, from, to, rates), to)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}