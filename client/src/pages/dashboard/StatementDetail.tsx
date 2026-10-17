import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { statementsApi } from '../../lib/statementsApi';
import type { Statement } from '../../types/statements';

export default function StatementDetail() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!email) return;
    statementsApi
      .forCustomer(decodeURIComponent(email))
      .then(setStatement)
      .catch((err) => {
        console.error(err);
        setError('Failed to load statement.');
      })
      .finally(() => setLoading(false));
  }, [email]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-500">Loading statement…</div>;
  }

  if (error || !statement) {
    return (
      <div>
        <button
          onClick={() => navigate('/dashboard/statements')}
          className="text-sm text-gray-400 hover:text-brand-orange mb-6"
        >
          ← Back to statements
        </button>
        <div className="card text-center py-12 text-red-400">
          {error || 'Statement not found.'}
        </div>
      </div>
    );
  }

  const { customer, lines, summary } = statement;

  return (
    <div>
      {/* Controls (hidden when printing) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/statements')}
          className="text-sm text-gray-400 hover:text-brand-orange"
        >
          ← Back to statements
        </button>
        <button onClick={handlePrint} className="btn-primary text-sm">
          📄 Download / Print PDF
        </button>
      </div>

      {/* Printable area */}
      <div
        ref={printRef}
        className="card print:bg-white print:text-black print:border-0 print:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap pb-6 mb-6 border-b-2 border-brand-black-muted print:border-black">
          <div>
            <h1 className="text-2xl font-bold print:text-black">
              Mbuyu CFL
            </h1>
            <p className="text-xs text-gray-500 print:text-gray-700">
              Clearing · Forwarding · Logistics
            </p>
            <p className="text-xs text-gray-500 print:text-gray-700 mt-1">
              Kampala, Uganda
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-brand-orange print:text-black">
              CUSTOMER STATEMENT
            </h2>
            <p className="text-xs text-gray-500 print:text-gray-700 mt-1">
              Generated {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer info */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 print:text-gray-700">
              Statement For
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
            {customer.address && (
              <p className="text-gray-400 print:text-gray-700">{customer.address}</p>
            )}
            {(customer.city || customer.country) && (
              <p className="text-gray-400 print:text-gray-700">
                {[customer.city, customer.country].filter(Boolean).join(', ')}
              </p>
            )}
            {customer.tinNumber && (
              <p className="text-gray-400 print:text-gray-700 text-xs mt-1">
                TIN: {customer.tinNumber}
              </p>
            )}
            {(customer.ninNumber || customer.passportNumber) && (
              <p className="text-gray-400 print:text-gray-700 text-xs">
                {customer.ninNumber ? 'NIN' : 'Passport'}:{' '}
                {customer.ninNumber || customer.passportNumber}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 print:text-gray-700">
              Account Since
            </p>
            <p className="text-white print:text-black">
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SummaryTile
            label="Total Quoted"
            value={`${summary.currency} ${summary.totalQuoted.toLocaleString()}`}
          />
          <SummaryTile
            label="Total Invoiced"
            value={`${summary.currency} ${summary.totalInvoiced.toLocaleString()}`}
          />
          <SummaryTile
            label="Outstanding"
            value={`${summary.currency} ${summary.outstandingBalance.toLocaleString()}`}
            accent="orange"
          />
          <SummaryTile
            label="Transactions"
            value={String(summary.quoteCount + summary.shipmentCount)}
          />
        </div>

        {/* Lines table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-black">
            <thead>
              <tr className="border-b-2 border-brand-black-muted print:border-black text-left text-xs uppercase text-gray-400 print:text-gray-700">
                <th className="py-3 pr-2">Date</th>
                <th className="py-3 pr-2">Reference</th>
                <th className="py-3 pr-2">Description</th>
                <th className="py-3 pr-2 text-right">Amount</th>
                <th className="py-3 pr-2 text-right">Tax</th>
                <th className="py-3 pr-2 text-right">Total</th>
                <th className="py-3 pr-2 text-right">Balance</th>
                <th className="py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No transactions yet.
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
                  <td className="py-3 pr-2 text-right text-gray-200 print:text-black font-mono text-xs">
                    {l.amount !== null
                      ? `${l.currency} ${l.amount.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="py-3 pr-2 text-right text-gray-400 print:text-gray-700 font-mono text-xs">
                    {l.taxAmount !== null
                      ? `${l.taxName || 'Tax'} ${l.currency} ${l.taxAmount}`
                      : '—'}
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

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-brand-black-muted print:border-black text-xs text-gray-500 print:text-gray-700">
          <p>
            Thank you for doing business with Mbuyu CFL. For any statement
            queries, contact{' '}
            <span className="text-brand-orange print:text-black">
              operations@mbuyucfl.com
            </span>
            .
          </p>
          <p className="mt-2">
            This statement is computer-generated and does not require a
            signature. Amounts shown are in {summary.currency}.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'orange';
}) {
  return (
    <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted print:bg-gray-100 print:border-gray-300">
      <p className="text-xs text-gray-500 uppercase tracking-wide print:text-gray-700">
        {label}
      </p>
      <p
        className={`text-base font-bold mt-1 ${
          accent === 'orange'
            ? 'text-brand-orange print:text-black'
            : 'text-white print:text-black'
        }`}
      >
        {value}
      </p>
    </div>
  );
}