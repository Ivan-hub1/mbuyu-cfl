import { useEffect, useRef, useState } from 'react';
import { statementsApi } from '../../lib/statementsApi';
import type { Statement } from '../../types/statements';

export default function MyStatements() {
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    statementsApi
      .mine()
      .then(setStatement)
      .catch((err) => {
        console.error(err);
        setError('Failed to load your statement.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card text-center py-12 text-gray-500">Loading your statement…</div>;
  }

  if (error || !statement) {
    return (
      <div className="card text-center py-12 text-red-400">
        {error || 'Statement not found.'}
      </div>
    );
  }

  const { customer, lines, summary } = statement;

  return (
    <div>
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Statement</h2>
          <p className="text-gray-400 text-sm mt-1">
            Transactions with Mbuyu CFL since{' '}
            {customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString()
              : 'day one'}
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-primary text-sm">
          📄 Download / Print PDF
        </button>
      </div>

      <div
        ref={printRef}
        className="card print:bg-white print:text-black print:border-0 print:p-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap pb-6 mb-6 border-b-2 border-brand-black-muted print:border-black">
          <div>
            <h1 className="text-2xl font-bold print:text-black">Mbuyu CFL</h1>
            <p className="text-xs text-gray-500 print:text-gray-700">
              Clearing · Forwarding · Logistics
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-brand-orange print:text-black">
              STATEMENT
            </h2>
            <p className="text-xs text-gray-500 print:text-gray-700 mt-1">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1 print:text-gray-700">
              Billed To
            </p>
            <p className="font-semibold text-white print:text-black text-base">
              {customer.name}
            </p>
            {customer.companyName && (
              <p className="text-gray-300 print:text-gray-700">
                {customer.companyName}
              </p>
            )}
            <p className="text-gray-400 print:text-gray-700">{customer.email}</p>
            {customer.phone && (
              <p className="text-gray-400 print:text-gray-700">{customer.phone}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-gray-500 uppercase mb-1 print:text-gray-700">
              Account Opened
            </p>
            <p className="text-white print:text-black">
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Tile
            label="Total Quoted"
            value={`${summary.currency} ${summary.totalQuoted.toLocaleString()}`}
          />
          <Tile
            label="Total Invoiced"
            value={`${summary.currency} ${summary.totalInvoiced.toLocaleString()}`}
          />
          <Tile
            label="Outstanding"
            value={`${summary.currency} ${summary.outstandingBalance.toLocaleString()}`}
            accent
          />
          <Tile
            label="Transactions"
            value={String(summary.quoteCount + summary.shipmentCount)}
          />
        </div>

        {/* Lines */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-brand-black-muted print:border-black text-left text-xs uppercase text-gray-400 print:text-gray-700">
                <th className="py-3 pr-2">Date</th>
                <th className="py-3 pr-2">Reference</th>
                <th className="py-3 pr-2">Description</th>
                <th className="py-3 pr-2 text-right">Total</th>
                <th className="py-3 pr-2 text-right">Balance</th>
                <th className="py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    You have no transactions yet.
                  </td>
                </tr>
              )}
              {lines.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-brand-black-muted/50 print:border-gray-300"
                >
                  <td className="py-3 pr-2 text-gray-400 print:text-gray-700 text-xs whitespace-nowrap">
                    {new Date(l.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-2 font-mono text-brand-orange print:text-black text-xs whitespace-nowrap">
                    {l.reference}
                  </td>
                  <td className="py-3 pr-2 text-gray-200 print:text-black">
                    <div>{l.description}</div>
                    <div className="text-xs text-gray-500 print:text-gray-700">
                      {l.route}
                    </div>
                  </td>
                  <td className="py-3 pr-2 text-right text-white print:text-black font-mono text-xs font-semibold">
                    {l.total !== null
                      ? `${l.currency} ${l.total.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="py-3 pr-2 text-right text-brand-orange print:text-black font-mono text-xs font-semibold">
                    {l.runningBalance > 0
                      ? `${l.currency} ${l.runningBalance.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        l.type === 'shipment'
                          ? 'bg-green-500/15 text-green-400'
                          : l.status === 'ACCEPTED'
                          ? 'bg-blue-500/15 text-blue-400'
                          : l.status === 'REJECTED'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-gray-500/15 text-gray-400'
                      } print:bg-gray-200 print:text-gray-800`}
                    >
                      {l.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-4 border-t border-brand-black-muted print:border-black text-xs text-gray-500 print:text-gray-700">
          <p>
            For any queries, contact{' '}
            <span className="text-brand-orange print:text-black">
              operations@mbuyucfl.com
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted print:bg-gray-100 print:border-gray-300">
      <p className="text-xs text-gray-500 uppercase print:text-gray-700">
        {label}
      </p>
      <p
        className={`text-base font-bold mt-1 ${
          accent ? 'text-brand-orange print:text-black' : 'text-white print:text-black'
        }`}
      >
        {value}
      </p>
    </div>
  );
}