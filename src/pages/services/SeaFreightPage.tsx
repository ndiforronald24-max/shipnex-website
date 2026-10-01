import { Link } from 'react-router-dom';
import { Waves, PackageCheck, Briefcase, MapPin, ShieldCheck, Check, Ship } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Waves, title: 'International Transportation', desc: 'Sail your cargo across oceans and reach buyers and suppliers in international markets.' },
  { icon: PackageCheck, title: 'Large & Heavy Cargo', desc: 'Sea freight carries what air freight cannot afford to fly, including bulky, heavy and oversized goods.' },
  { icon: Briefcase, title: 'Business-Friendly Solutions', desc: 'Built for importers, exporters, wholesalers, retailers and growing businesses that ship regularly.' },
  { icon: MapPin, title: 'Shipment Visibility', desc: 'Track your cargo at every stage of the voyage, from the origin port to the destination port.' },
  { icon: ShieldCheck, title: 'Careful Handling', desc: 'We plan how your cargo is loaded, secured and coordinated so it arrives intact.' },
];

/** Short bulleted list rendered as chips under "What You Can Ship By Sea". */
const suitedTo = [
  'Full container shipments',
  'Large commercial cargo',
  'Machinery and equipment',
  'Furniture',
  'Wholesale goods',
  'Vehicles and large items',
  'International imports and exports',
];

export default function SeaFreightPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate min-h-[620px] flex items-center overflow-hidden">
        <img
          src="/images/sea-freight-cover.svg"
          alt="Container ship carrying stacked freight across the ocean at dusk"
          className="absolute inset-0 -z-10 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 hero-overlay" aria-hidden="true"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a1030] via-[#0a1030]/70 to-[#0a1030]/10" aria-hidden="true"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Move More. Ship Further. <span className="text-[#ff6f00]">Go Global.</span>
              </h1>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                When a shipment is too large, too heavy or too high in volume for air freight, sea freight is the efficient way to move it across international borders.
              </p>
              <p className="text-base text-gray-300 mb-8 leading-relaxed">
                ShipNex provides sea freight solutions for businesses, importers, exporters and individuals who need dependable transportation for larger shipments. Whether you are shipping containers, commercial products, machinery, equipment or other large cargo, we help coordinate the journey from origin to destination.
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
                <Ship className="w-32 h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is sea freight - plain definition for first-time visitors */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Sea Freight?</h2>
          <p className="text-gray-600 leading-relaxed">
            Sea freight is shipping by cargo ship. Your goods are packed into a container, loaded onto a vessel, sailed to the destination port and unloaded there. It costs far less per kilo than air freight and handles almost any weight, which makes it the standard way to move large cargo between countries.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNex Sea Freight? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNex Sea Freight?</h2>
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
                This one answers the first question a new visitor asks. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <Ship className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">FCL &amp; LCL Options</h3>
              <p className="text-sm text-gray-200 leading-relaxed">Pay for a whole container, or share one when you have less to ship.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Ship By Sea */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">What You Can Ship By Sea</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            Sea freight suits anything that is too big or too heavy to send by air, from a single container to regular commercial cargo.
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
          <h2 className="text-3xl font-bold mb-4">Ready to Ship?</h2>
          <p className="text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            From smaller commercial loads to large-scale international cargo, ShipNex helps make sea transportation easier to manage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex flex-col items-center px-8 py-4 bg-[#ff6f00] rounded-xl font-semibold hover:bg-[#e65100] transition-colors"
            >
              Get a Quote
              <span className="text-xs font-normal text-white/85 mt-1">
                Tell us about your cargo, origin, destination and shipping requirements.
              </span>
            </Link>
            <Link
              to="/track"
              className="inline-flex flex-col items-center px-8 py-4 border-2 border-white/70 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Track Shipment
              <span className="text-xs font-normal text-white/70 mt-1">
                Already shipped with ShipNex? Follow your cargo using your tracking number.
              </span>
            </Link>
          </div>
          <p className="mt-12 text-lg font-semibold tracking-wide text-white/90">
            Move Bigger. Reach Farther. <span className="text-[#ff8f00]">ShipNex.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
