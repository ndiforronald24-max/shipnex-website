import { Link } from 'react-router-dom';
import { Truck, PackageCheck, Globe, MapPin, Route, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Truck, title: 'Flexible Transportation', desc: 'Choose the practical option for your shipment, whether it needs a whole truck or a few pallet spaces.' },
  { icon: Route, title: 'Door-to-Door Delivery', desc: 'We collect from your pickup point and deliver to your final destination, so you deal with one company only.' },
  { icon: Globe, title: 'Regional & Cross-Border Shipping', desc: 'Move goods between cities, regions and neighbouring countries with the paperwork handled for you.' },
  { icon: PackageCheck, title: 'Cargo Solutions', desc: 'Suitable for commercial goods, packages, equipment and larger shipments that need secure transport.' },
  { icon: MapPin, title: 'Shipment Tracking', desc: 'Follow your shipment from pickup to delivery and stay informed about its progress.' },
];

/** Short bulleted list rendered as chips under "What You Can Ship By Road". */
const suitedTo = [
  'Business deliveries',
  'Commercial goods',
  'Retail inventory',
  'Equipment',
  'Furniture',
  'Regional shipments',
  'Cross-border cargo',
  'Door-to-door deliveries',
];

export default function RoadFreightPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Reliable Transportation <span className="text-[#ff6f00]">From Door to Door</span>
              </h1>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                Road freight is at the heart of efficient regional and domestic transportation. ShipNexaro provides flexible road freight solutions for businesses and individuals who need their goods moved safely and reliably by road.
              </p>
              <p className="text-base text-gray-300 mb-8 leading-relaxed">
                From local deliveries to cross-border transportation, we help move your cargo where it needs to go.
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
            <div className="hidden md:flex justify-center">
              <div className="w-80 h-80 bg-white/10 rounded-full flex items-center justify-center">
                <Truck className="w-32 h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is road freight - plain definition for first-time visitors */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Road Freight?</h2>
          <p className="text-gray-600 leading-relaxed">
            Road freight is moving goods by truck or van. Your cargo is loaded at the pickup point, driven to its destination and unloaded there, either within one country or across a border into a neighbouring one. It is the most flexible way to move goods, because it can reach places ships and planes cannot.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNexaro Road Freight? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNexaro Road Freight?</h2>
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
            {/* Five benefit cards leave a sixth cell empty in a 3-column grid.
                This one names the two loading options a new visitor asks about. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <Truck className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">FTL &amp; LTL Loading</h3>
              <p className="text-sm text-gray-200 leading-relaxed">Book a whole truck for a full load, or share one when you have less to send.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Ship By Road */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">What You Can Ship By Road</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            Road freight handles everything from a single urgent pallet to a full commercial load, locally or across a border.
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
          <h2 className="text-3xl font-bold mb-4">Ready to Move Your Cargo?</h2>
          <p className="text-gray-200 mb-4 max-w-2xl mx-auto leading-relaxed">
            Your customers are waiting. Your business cannot afford unnecessary delays.
          </p>
          <p className="text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            ShipNexaro helps you move your goods efficiently, giving you a dependable transportation partner for the road ahead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex flex-col items-center px-8 py-4 bg-[#ff6f00] rounded-xl font-semibold hover:bg-[#e65100] transition-colors"
            >
              Get a Quote
              <span className="text-xs font-normal text-white/85 mt-1">
                Tell us what you need transported and where it needs to go.
              </span>
            </Link>
            <Link
              to="/track"
              className="inline-flex flex-col items-center px-8 py-4 border-2 border-white/70 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Track Shipment
              <span className="text-xs font-normal text-white/70 mt-1">
                Follow your shipment and stay updated throughout its journey.
              </span>
            </Link>
          </div>
          <p className="mt-12 text-lg font-semibold tracking-wide text-white/90">
            Wherever the Road Leads, <span className="text-[#ff8f00]">ShipNexaro Moves With You.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
