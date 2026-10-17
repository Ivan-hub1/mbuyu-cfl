import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';

const SERVICES = [
  {
    icon: '⚓',
    title: 'Customs Clearing',
    tagline: 'Fast, compliant clearance at all ports and border posts.',
    description:
      'We handle the entire customs clearance process so your cargo moves across borders without delays. Our licensed brokers know the regulations inside and out.',
    features: [
      'Import declarations & documentation',
      'Export processing & compliance',
      'Duty & tax assessment',
      'Border post facilitation',
      'Customs advisory & consulting',
    ],
  },
  {
    icon: '✈️',
    title: 'Freight Forwarding',
    tagline: 'Air, sea and road freight with competitive rates worldwide.',
    description:
      'Whether you need urgent air cargo or cost-effective sea shipments, we coordinate the entire journey from origin to destination.',
    features: [
      'Air freight (urgent, high-value)',
      'Sea freight — FCL (Full Container Load)',
      'Sea freight — LCL (Shared Container)',
      'Road freight across East Africa',
      'Multimodal door-to-door solutions',
    ],
  },
  {
    icon: '🏭',
    title: 'Warehousing',
    tagline: 'Secure storage and distribution from our facilities.',
    description:
      'Short-term or long-term storage for your cargo, with full inventory visibility and options for distribution as needed.',
    features: [
      'Bonded warehouse facilities',
      'Distribution centers',
      'Inventory tracking & management',
      'Order fulfillment & packing',
      'Cross-docking services',
    ],
  },
  {
    icon: '🚚',
    title: 'Last-Mile Delivery',
    tagline: 'Reliable door-to-door delivery with live tracking.',
    description:
      "From our warehouse to your customer's door — fast, reliable delivery across Uganda, Kenya, Tanzania, Rwanda and beyond.",
    features: [
      'Same-day & scheduled delivery',
      'Door-to-door service',
      'Cash on delivery options',
      'Live tracking for the customer',
      'Proof of delivery documentation',
    ],
  },
  {
    icon: '📊',
    title: 'Cargo Tracking',
    tagline: 'Full visibility from pickup to delivery — like FedEx.',
    description:
      'Every shipment gets a unique tracking number. Track status online 24/7, with detailed event timelines and document downloads.',
    features: [
      'Unique tracking number for every shipment',
      'Real-time status updates',
      'Online tracking portal (no login needed)',
      'Document upload & download',
      'Email + SMS notifications',
    ],
  },
  {
    icon: '💡',
    title: 'Trade Consulting',
    tagline: 'Advisory, documentation and compliance support.',
    description:
      "Whether you're new to international trade or looking to optimize an existing supply chain, our team can help.",
    features: [
      'Trade documentation review',
      'Regulatory & compliance advice',
      'Tariff classification & optimization',
      'Supply chain design',
      'Training for your team',
    ],
  },
];

const WHY_US = [
  {
    icon: '🌍',
    title: 'Pan-African Network',
    description:
      'Trusted partners and routes across Africa and global trade hubs — from Guangzhou to Kampala and beyond.',
  },
  {
    icon: '⚡',
    title: 'Fast & Reliable',
    description:
      'We prioritize speed without compromising compliance. Most shipments move through customs in under 48 hours.',
  },
  {
    icon: '🔒',
    title: 'Cargo Safety',
    description:
      'Every shipment is tracked, insured where required, and handled by vetted partners across our network.',
  },
  {
    icon: '👥',
    title: 'Dedicated Support',
    description:
      'Real humans answer your calls. Your dedicated account manager is with you from quote to delivery.',
  },
];

export default function Services() {
  return (
    <>
      <SEO
        title="Our Services — Customs, Freight, Warehousing"
        description="Customs clearing, freight forwarding, warehousing, last-mile delivery, cargo tracking and trade consulting."
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
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-6">
            WHAT WE DO
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl mx-auto">
            End-to-end logistics,{' '}
            <span className="text-brand-orange">from port to door.</span>
          </h1>
          <p className="text-gray-300 text-lg mt-6 max-w-2xl mx-auto">
            Clearing, forwarding, warehousing and last-mile delivery — six
            services, one trusted partner across Africa and beyond.
          </p>
          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            <Link to="/quote" className="btn-primary">
              Request a Quote
            </Link>
            <Link to="/track" className="btn-outline">
              Track Shipment
            </Link>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="space-y-6">
          {SERVICES.map((service, i) => (
            <div
              key={service.title}
              className={`card md:grid md:grid-cols-3 md:gap-8 items-start hover:border-brand-orange/50 transition ${
                i % 2 === 1 ? 'md:bg-brand-black-soft' : ''
              }`}
            >
              <div className="md:col-span-1 mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center text-3xl mb-4">
                  {service.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{service.title}</h2>
                <p className="text-brand-orange text-sm font-medium">
                  {service.tagline}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-300 mb-4">{service.description}</p>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <span className="text-brand-orange mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-brand-black-soft border-y border-brand-black-muted py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-4">
              WHY MBUYU CFL
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Why companies{' '}
              <span className="text-brand-orange">choose us</span>
            </h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
              Four reasons our clients trust us with their cargo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <div key={item.title} className="card">
                <div className="w-12 h-12 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center text-2xl mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-orange to-brand-orange-dark p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to move your cargo?
            </h3>
            <p className="text-white/80 mt-2">
              Get a tailored quote in under 24 hours.
            </p>
          </div>
          <Link
            to="/quote"
            className="bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-brand-black-soft transition whitespace-nowrap"
          >
            Request Quote →
          </Link>
        </div>
      </section>
    </>
  );
}