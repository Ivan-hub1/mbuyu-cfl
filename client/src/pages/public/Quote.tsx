import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import SectionHeading from '../../components/ui/SectionHeading';
import SEO from '../../components/seo/SEO';
import { COUNTRIES } from '../../data/countries';
import {
  CARGO_TYPES,
  TRANSPORT_MODES,
  INCOTERMS,
  CURRENCIES,
  CONTACT_METHODS,
  WET_CARGO_SUBTYPES,
  WET_CARGO_VALUE,
} from '../../data/constants';
import { createQuote } from '../../lib/quotes';
import type { QuoteRequest } from '../../types';

const quoteSchema = z
  .object({
    fullName: z.string().min(2, 'Please enter your full name'),
    companyName: z.string().optional(),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(7, 'Enter a valid phone number'),
    preferredContact: z.string().min(1, 'Choose a contact method'),
    cargoType: z.string().min(1, 'Select cargo type'),
    cargoSubType: z.string().optional(),
    transportMode: z.string().min(1, 'Select transport mode'),
    weightKg: z.string().min(1, 'Enter weight'),
    volumeCbm: z.string().optional(),
    pieces: z.string().min(1, 'Enter number of pieces'),
    cargoDescription: z.string().min(5, 'Describe the cargo'),
    cargoValue: z.string().optional(),
    cargoValueCurrency: z.string().optional(),
    originCountry: z.string().min(1, 'Select origin country'),
    originCity: z.string().min(2, 'Enter origin city or port'),
    destinationCountry: z.string().min(1, 'Select destination country'),
    destinationCity: z.string().min(2, 'Enter destination city or port'),
    shippingDate: z.string().min(1, 'Choose a shipping date'),
    incoterms: z.string().min(1, 'Select incoterms'),
    specialRequirements: z.string().optional(),
    hasDocuments: z.boolean().optional(),
  })
  .refine(
    (data) => data.cargoType !== WET_CARGO_VALUE || !!data.cargoSubType,
    {
      message: 'Please specify the type of wet cargo',
      path: ['cargoSubType'],
    }
  );

type QuoteFormData = z.infer<typeof quoteSchema>;

const countryOptions = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));

export default function Quote() {
  const [submitted, setSubmitted] = useState<QuoteRequest | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      preferredContact: 'Email',
      transportMode: '',
      cargoValueCurrency: 'USD',
      hasDocuments: false,
      cargoType: '',
      cargoSubType: '',
    },
  });

  const selectedCargoType = watch('cargoType');
  const isWetCargo =
    typeof selectedCargoType === 'string' &&
    selectedCargoType.trim() === WET_CARGO_VALUE;

  const onSubmit = async (data: QuoteFormData) => {
    setError('');
    try {
      const finalCargoType =
        data.cargoType === WET_CARGO_VALUE && data.cargoSubType
          ? `${WET_CARGO_VALUE} (${data.cargoSubType})`
          : data.cargoType;

      const payload = {
        ...data,
        cargoType: finalCargoType,
        cargoSubType: undefined,
        hasDocuments: !!data.hasDocuments,
      };

      const quote = await createQuote(payload as any);
      setSubmitted(quote);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(
        'Failed to submit quote. Please check your connection and try again.'
      );
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════════════════════════
  if (submitted) {
    return (
      <>
        <SEO
          title="Quote Request Received"
          description="Mbuyu CFL — your quote request has been received."
        />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="card text-center">
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-4xl font-bold mb-5 border-2 border-green-500/30">
              ✓
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Quote Request Received
            </h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Thank you,{' '}
              <span className="text-white font-medium">
                {submitted.fullName}
              </span>
              . Our team is reviewing your shipment.
            </p>

            {/* Reference number block */}
            <div className="bg-brand-black border border-brand-black-muted rounded-lg p-5 mb-6 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Your Reference Number
              </p>
              <p className="font-mono text-brand-orange font-semibold text-lg">
                {submitted.reference}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Save this — you'll need it to follow up on your quote.
              </p>
            </div>

            {/* What happens next */}
            <div className="text-left bg-brand-black-soft border border-brand-black-muted rounded-lg p-5 mb-6">
              <h3 className="font-semibold text-brand-orange mb-3 text-sm uppercase tracking-wide">
                What happens next?
              </h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="text-gray-300">
                    Our team reviews your shipment details
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="text-gray-300">
                    We email you a tailored quote{' '}
                    <strong className="text-white">Shortly</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span className="text-gray-300">
                    Your email will include a one-click link to{' '}
                    <strong className="text-white">
                      create your customer account
                    </strong>{' '}
                    and accept the quote
                  </span>
                </li>
              </ol>
            </div>

            {/* No account needed note */}
            <div className="text-left bg-blue-500/5 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">
                💡 No account needed yet
              </p>
              <p className="text-sm text-gray-300">
                You don't need an Mbuyu CFL account to receive a quote. Once we
                respond, your email will include a link to create one in under
                a minute — with your details already filled in.
              </p>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              A copy of your reference has been sent to{' '}
              <span className="text-white">{submitted.email}</span>.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/" className="btn-primary">
                Back to Home
              </Link>
              <Link to="/track" className="btn-outline">
                Track a Shipment
              </Link>
              <button
                onClick={() => {
                  setSubmitted(null);
                  window.scrollTo({ top: 0 });
                }}
                className="btn-ghost"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <SEO
        title="Request a Quote"
        description="Get a tailored shipping quote from Mbuyu CFL Shortly. No account needed."
      />
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-4">
            REQUEST A QUOTE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Tell us about your{' '}
            <span className="text-brand-orange">shipment</span>
          </h1>
          <p className="text-gray-400 mb-5">
            Fill in the details below and our team will get back to you with a
            tailored quote Shortly.
          </p>

          {/* No account needed banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/30">
            <span className="text-2xl shrink-0">✨</span>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-0.5">
                No account needed to request a quote
              </p>
              <p className="text-xs text-gray-400">
                Just fill in your shipment details. If you like our quote, we'll
                send you a one-click link to create your customer account — with
                your details pre-filled.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* ─── Contact ─── */}
          <section className="card">
            <SectionHeading
              icon="📞"
              title="Contact Information"
              subtitle="How can we reach you about this quote?"
            />
            <div className="grid md:grid-cols-2 gap-5">
              <FormField
                label="Full Name"
                required
                error={errors.fullName?.message}
              >
                <input
                  className="input-field"
                  placeholder="e.g. John Ssekandi"
                  {...register('fullName')}
                />
              </FormField>
              <FormField
                label="Company Name"
                hint="Optional — for corporate clients"
              >
                <input
                  className="input-field"
                  placeholder="e.g. Acme Ltd"
                  {...register('companyName')}
                />
              </FormField>
              <FormField
                label="Email Address"
                required
                error={errors.email?.message}
              >
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@company.com"
                  {...register('email')}
                />
              </FormField>
              <FormField
                label="Phone Number"
                required
                error={errors.phone?.message}
              >
                <input
                  className="input-field"
                  placeholder="+256 700 000 000"
                  {...register('phone')}
                />
              </FormField>
              <FormField
                label="Preferred Contact Method"
                required
                error={errors.preferredContact?.message}
                className="md:col-span-2"
              >
                <div className="flex flex-wrap gap-3 mt-1">
                  {CONTACT_METHODS.map((method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer bg-brand-black border border-brand-black-muted hover:border-brand-orange/50 rounded-lg px-4 py-2.5 transition has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange/10"
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register('preferredContact')}
                        className="accent-brand-orange"
                      />
                      <span className="text-sm">{method}</span>
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
          </section>

          {/* ─── Shipment ─── */}
          <section className="card">
            <SectionHeading
              icon="📦"
              title="Shipment Details"
              subtitle="What are you shipping?"
            />
            <div className="grid md:grid-cols-2 gap-5">
              <FormField
                label="Cargo Type"
                required
                error={errors.cargoType?.message}
              >
                <select
                  className="input-field"
                  {...register('cargoType')}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select cargo type
                  </option>
                  {CARGO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>

              {isWetCargo && (
                <FormField
                  label="Type of Wet Cargo"
                  required
                  error={errors.cargoSubType?.message}
                  hint="PM / AGO / Kerosene"
                >
                  <select
                    className="input-field"
                    {...register('cargoSubType')}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select fuel type
                    </option>
                    {WET_CARGO_SUBTYPES.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField
                label="Mode of Transport"
                required
                error={errors.transportMode?.message}
              >
                <Select
                  placeholder="Select transport mode"
                  options={TRANSPORT_MODES}
                  {...register('transportMode')}
                />
              </FormField>

              <FormField
                label="Weight (kg)"
                required
                error={errors.weightKg?.message}
                hint="Approximate total weight"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="e.g. 1500"
                  {...register('weightKg')}
                />
              </FormField>

              <FormField
                label="Volume (CBM)"
                hint="Optional — total cubic meters"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="e.g. 12.5"
                  {...register('volumeCbm')}
                />
              </FormField>

              <FormField
                label="Number of Pieces"
                required
                error={errors.pieces?.message}
              >
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="e.g. 25"
                  {...register('pieces')}
                />
              </FormField>

              <FormField
                label="Cargo Value"
                hint="Optional — for insurance & customs"
              >
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field flex-1"
                    placeholder="e.g. 25000"
                    {...register('cargoValue')}
                  />
                  <select
                    {...register('cargoValueCurrency')}
                    className="input-field w-28"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>

              <FormField
                label="Cargo Description"
                required
                error={errors.cargoDescription?.message}
                className="md:col-span-2"
              >
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Describe your cargo (e.g. 'Electronic components, fragile, packed in 25 cartons')"
                  {...register('cargoDescription')}
                />
              </FormField>
            </div>
          </section>

          {/* ─── Route ─── */}
          <section className="card">
            <SectionHeading
              icon="📍"
              title="Route & Schedule"
              subtitle="Where is it coming from and going?"
            />
            <div className="grid md:grid-cols-2 gap-5">
              <FormField
                label="Origin Country"
                required
                error={errors.originCountry?.message}
              >
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  {...register('originCountry')}
                />
              </FormField>
              <FormField
                label="Origin City / Port"
                required
                error={errors.originCity?.message}
              >
                <input
                  className="input-field"
                  placeholder="e.g. Guangzhou"
                  {...register('originCity')}
                />
              </FormField>
              <FormField
                label="Destination Country"
                required
                error={errors.destinationCountry?.message}
              >
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  {...register('destinationCountry')}
                />
              </FormField>
              <FormField
                label="Destination City / Port"
                required
                error={errors.destinationCity?.message}
              >
                <input
                  className="input-field"
                  placeholder="e.g. Kampala"
                  {...register('destinationCity')}
                />
              </FormField>
              <FormField
                label="Preferred Shipping Date"
                required
                error={errors.shippingDate?.message}
              >
                <input
                  type="date"
                  className="input-field"
                  {...register('shippingDate')}
                />
              </FormField>
              <FormField
                label="Incoterms"
                required
                error={errors.incoterms?.message}
                hint="Not sure? Choose 'Not Sure' and we'll advise"
              >
                <Select
                  placeholder="Select incoterms"
                  options={INCOTERMS}
                  {...register('incoterms')}
                />
              </FormField>
            </div>
          </section>

          {/* ─── Additional ─── */}
          <section className="card">
            <SectionHeading
              icon="📝"
              title="Additional Information"
              subtitle="Anything else we should know?"
            />
            <FormField label="Special Requirements">
              <textarea
                rows={4}
                className="input-field resize-none"
                placeholder="e.g. 'Must arrive before 15 Oct', 'Requires temperature control', 'Fragile handling needed'"
                {...register('specialRequirements')}
              />
            </FormField>
            <label className="flex items-start gap-3 mt-5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-brand-orange w-4 h-4"
                {...register('hasDocuments')}
              />
              <span className="text-sm text-gray-300">
                I have documents (packing list, commercial invoice, etc.) that I
                can share. Our team will request them by email.
              </span>
            </label>
          </section>

          {error && (
            <div className="card border-red-500/40 bg-red-500/5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link to="/" className="btn-outline text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Quote Request'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By submitting, you agree to be contacted by Mbuyu CFL regarding this
            quote. Your information is kept confidential. No account required.
          </p>
        </form>
      </div>
    </>
  );
}