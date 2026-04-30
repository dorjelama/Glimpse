'use client';

import { useEffect, useState } from 'react';
import { api, PricingConfig } from '@/lib/api';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'US Dollar' },
  { code: 'NPR', symbol: 'Rs.', label: 'Nepalese Rupee' },
  { code: 'EUR', symbol: '€',  label: 'Euro' },
  { code: 'GBP', symbol: '£',  label: 'British Pound' },
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

function symbolFor(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [proMonthly, setProMonthly] = useState<string>('');
  const [businessMonthly, setBusinessMonthly] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    api.getPricing()
      .then((p) => {
        setPricing(p);
        setProMonthly(String(p.proMonthly));
        setBusinessMonthly(String(p.businessMonthly));
        setCurrency(p.currency);
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const pro = parseInt(proMonthly, 10);
      const biz = parseInt(businessMonthly, 10);
      if (Number.isNaN(pro) || Number.isNaN(biz)) {
        throw new Error('Prices must be whole numbers');
      }
      const updated = await api.updatePricing({
        proMonthly: pro,
        businessMonthly: biz,
        currency,
      });
      setPricing(updated);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const symbol = symbolFor(currency);
  const dirty = pricing && (
    String(pricing.proMonthly) !== proMonthly ||
    String(pricing.businessMonthly) !== businessMonthly ||
    pricing.currency !== currency
  );

  return (
    <div className="px-6 py-8 md:px-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2d1a00' }}>
          Pricing
        </h1>
        <p className="text-sm mt-1" style={{ color: '#a08060' }}>
          Set the subscription amounts shown on the landing page and upgrade gates.
        </p>
      </div>

      {error && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#b05030', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {!pricing ? (
        <div
          className="rounded-2xl p-5 text-sm"
          style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0', color: '#a08060' }}
        >
          Loading…
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
        >
          {/* Currency */}
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#b09060' }}>
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-white"
              style={{ border: '1px solid #e8d5b0', color: '#2d1a00' }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Pro */}
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#b09060' }}>
              Pro plan — monthly
            </label>
            <div className="flex items-center rounded-lg bg-white" style={{ border: '1px solid #e8d5b0' }}>
              <span className="px-3 text-sm font-semibold" style={{ color: '#a08060' }}>{symbol}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={proMonthly}
                onChange={(e) => setProMonthly(e.target.value)}
                className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none"
                style={{ color: '#2d1a00' }}
                required
              />
              <span className="pr-3 text-xs" style={{ color: '#b09060' }}>/ month</span>
            </div>
          </div>

          {/* Business */}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#b09060' }}>
              Business plan — monthly
            </label>
            <div className="flex items-center rounded-lg bg-white" style={{ border: '1px solid #e8d5b0' }}>
              <span className="px-3 text-sm font-semibold" style={{ color: '#a08060' }}>{symbol}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={businessMonthly}
                onChange={(e) => setBusinessMonthly(e.target.value)}
                className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none"
                style={{ color: '#2d1a00' }}
                required
              />
              <span className="pr-3 text-xs" style={{ color: '#b09060' }}>/ month</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: '#a08060' }}>
              Last updated {new Date(pricing.updatedAt).toLocaleString()}
            </p>
            <div className="flex items-center gap-3">
              {savedAt && (
                <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>✓ Saved</span>
              )}
              <button
                type="submit"
                disabled={saving || !dirty}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#B85C37', color: '#F6EBDD', border: '1px solid #9e4e2f' }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      <p className="mt-4 text-xs leading-relaxed" style={{ color: '#a08060' }}>
        Changes take effect immediately on the public landing page (cached up to 60 seconds) and on any in-app upgrade gates.
      </p>
    </div>
  );
}
