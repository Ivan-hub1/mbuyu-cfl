import { Link } from 'react-router-dom';
import TrackingForm from '../../components/tracking/TrackingForm';
import ServicesMap from '../../components/map/ServicesMap';
import SEO from '../../components/seo/SEO';
import ForexWidget from '../../components/ForexWidget';
import ForexCalculator from '../../components/ForexCalculator';

export default function Home() {
  return (
    <>
      <SEO
        title="Mbuyu CFL — Move cargo without borders"
        description="Clearing, forwarding, warehousing and last-mile delivery across Africa and beyond. Get a quote in 24 hours."
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black-soft to-black" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #E85D04 0%, transparent 40%), radial-gradient(circle at 80% 70%, #E85D04 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-6">
              CLEARING • FORWARDING • LOGISTICS
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Move cargo <span className="text-brand-orange">without borders.</span>
            </h1>
            <p className="text-gray-300 text-lg mt-6 max-w-lg">
              Mbuyu CFL handles your customs clearing, freight forwarding, and last-mile
              delivery — from port to door, with full real-time visibility.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/quote" className="btn-primary">Request a Quote</Link>
              <Link to="/track" className="btn-outline">Track Shipment</Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Track Your Cargo</h3>
            <TrackingForm />
            <p className="text-xs text-gray-500 mt-4">
              Enter your tracking number (e.g. <span className="text-brand-orange">MBCFL-2024-00123</span>)
            </p>
          </div>
        </div>
      </section>

      {/* Services with Map Background */}
      <section className="relative overflow-hidden min-h-[500px]">
        <ServicesMap />
        <div className="map-overlay-tint" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Delivering across <span className="text-brand-orange">continents</span>
          </h2>
          <p className="text-gray-300 mt-3 max-w-2xl mx-auto">
            From Guangzhou to Kampala — and beyond. Our network connects Africa
            to the world and Africa to itself through trusted routes across
            East, Central and North Africa.
          </p>
        </div>
      </section>

      {/* Forex — Live Rates & Calculator */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            Know your <span className="text-brand-orange">Rates</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            Live exchange rates and a built-in calculator — so you can plan your
            shipment costs in the currency that matters to you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ForexWidget />
          <ForexCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-orange to-brand-orange-dark p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Need a shipment quote?</h3>
            <p className="text-white/80 mt-2">Get a tailored quote in under 24 hours.</p>
          </div>
          <Link
            to="/quote"
            className="bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-brand-black-soft transition"
          >
            Request Quote →
          </Link>
        </div>
      </section>
    </>
  );
}