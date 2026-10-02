import { Link } from 'react-router-dom';
import { Zap, Globe, PackageCheck, MapPin, ShieldCheck, Check, Clock, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: 'Speed When It Matters', desc: 'Moving by air is the fastest way to cross borders, so your parcel or cargo arrives in days instead of weeks.' },
  { icon: Globe, title: 'Global Reach', desc: 'One booking takes your shipment to destinations around the world through our international shipping network.' },
  { icon: PackageCheck, title: 'Professional Cargo Handling', desc: 'Your goods are loaded, secured and unloaded by trained crews, so they arrive in the condition you sent them.' },
  { icon: MapPin, title: 'Shipment Tracking', desc: 'Get live status updates from departure to destination, so you always know where your shipment is.' },
  { icon: ShieldCheck, title: 'Reliable & Secure', desc: 'Safe handling, accurate customs paperwork and dependable transport on every lane we fly.' },
];

/** Short bulleted list rendered as chips under "Perfect For". */
const suitedTo = [
  'Urgent shipments',
  'International packages',
  'Business cargo',
  'Documents',
  'Electronics and valuable goods',
  'Time-sensitive products',
  'Commercial shipments',
];

export default function AirFreightPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate min-h-[620px] flex items-center overflow-hidden">
        <img
          src="/images/air-freight-cover.svg"
          alt="Cargo aircraft being loaded with palletised freight at dusk"
          className="absolute inset-0 -z-10 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 hero-overlay" aria-hidden="true"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a1030] via-[#0a1030]/70 to-[#0a1030]/10" aria-hidden="true"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Fast, Reliable Shipping <span className="text-[#ff6f00]">Across the World</span>
            </h1>
            <p className="text-lg text-gray-200 mb-4 leading-relaxed">
              When time matters, your shipment cannot wait. ShipNexaro Air Freight gets it moving quickly, giving businesses and individuals dependable air cargo solutions for goods travelling across cities, countries, and continents.
            </p>
            <p className="text-base text-gray-300 mb-8 leading-relaxed">
              From important business documents and commercial goods to urgent packages and special cargo, we combine four things in every shipment: speed, security, visibility at every step, and professional handling.
            </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/contact" className="px-6 py-3 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors">
                  Get a Quote
                </Link>
                <Link to="/track" className="px-6 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-[#1a237e] transition-colors">
                  Track Shipment
                </Link>
              </div>
          </div>
        </div>
      </section>

      {/* What is air freight - plain definition for first-time visitors */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Air Freight?</h2>
          <p className="text-gray-600 leading-relaxed">
            Air freight is shipping by aircraft. Your goods are loaded onto a plane, flown to their destination airport, and delivered to the recipient. It is the quickest way to move something a long distance, which is why businesses and individuals use it for urgent and high-value consignments.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNexaro Air Freight? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNexaro Air Freight?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-[#ff6f00]/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-[#ff6f00]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
            {/* The list has five items, so the sixth cell carries the promise
                rather than leaving a hole in the 3-column grid. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <Clock className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">1-3 Business Days</h3>
              <p className="text-sm text-gray-200 leading-relaxed">Typical door-to-door transit on most international air lanes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Ship By Air */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">What You Can Ship By Air</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            Air freight is the right choice whenever your shipment cannot wait. It suits anything from a single urgent parcel to regular business cargo.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {suitedTo.map((item) => (
              <li key={item} className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <span className="w-8 h-8 rounded-lg bg-[#ff6f00]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-[#ff6f00]" />
                </span>
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1a237e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ship With Confidence</h2>
          <p className="text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Whether you are sending one package or shipping goods for your business every week, ShipNexaro is ready to move your cargo efficiently. Tell us what you are sending and where it needs to go, and we will quote the fastest, most reliable air option.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors">
            Get a Quote <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-10 text-lg font-semibold tracking-wide text-white/90">
            Fast. Connected. Reliable. <span className="text-[#ff8f00]">ShipNexaro.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
