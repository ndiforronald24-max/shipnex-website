import { Link } from 'react-router-dom';
import { Zap, PackageCheck, Globe, MapPin, ShieldCheck, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: 'Priority Speed', desc: 'Built for shipments where fast delivery matters, so your package moves at the front of the queue instead of waiting its turn.' },
  { icon: PackageCheck, title: 'Simple Shipping', desc: 'A straightforward way to send a package quickly, without complicated options or extra steps.' },
  { icon: Globe, title: 'International & Regional Options', desc: 'Send important items to destinations across borders and regions, as far as you need to go.' },
  { icon: MapPin, title: 'Track Your Package', desc: 'Follow your shipment as it moves toward its destination, so you always know where it is.' },
  { icon: ShieldCheck, title: 'Professional Handling', desc: 'Your package is sorted, carried and delivered carefully at every step of the journey.' },
];

/** Short bulleted list rendered as chips under "Perfect For Parcels". */
const suitedTo = [
  'Urgent documents',
  'Important personal packages',
  'Business orders',
  'Time-sensitive items',
  'E-commerce deliveries',
  'Gifts',
  'Small parcels',
];

export default function ExpressShippingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                When Every Minute <span className="text-[#ff6f00]">Counts</span>
              </h1>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                Some shipments simply cannot wait.
              </p>
              <p className="text-base text-gray-300 mb-8 leading-relaxed">
                ShipNex Express Shipping is designed for customers who need their packages delivered quickly and efficiently. Whether you are sending an urgent document, a personal package, a business order or a time-sensitive item, we help get it moving without unnecessary delays.
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
                <Zap className="w-32 h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Express Shipping?</h2>
          <p className="text-gray-600 leading-relaxed">
            Express shipping is a service built around speed. Your package is given priority at every stage, from collection through sorting and delivery, so it arrives sooner than standard shipping. It costs more than standard, and it is the right choice when the delivery date matters more than the price.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNex Express? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNex Express?</h2>
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
                Rather than publish service levels and delivery windows we cannot
                guarantee, this cell routes the reader to a real conversation. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <Zap className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">How Fast Do You Need It?</h3>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">
                Tell us your destination and deadline, and we will confirm what we can deliver.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff8f00] hover:text-white transition-colors">
                Ask our express team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Parcels */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Perfect For</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            Express shipping suits anything small enough to send as a parcel where the arrival date really matters.
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

      <section className="py-16 bg-[#1a237e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't Wait. Ship Today.</h2>
          <p className="text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            When something needs to arrive quickly, choose a shipping service built around speed and reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex flex-col items-center px-8 py-4 bg-[#ff6f00] rounded-xl font-semibold hover:bg-[#e65100] transition-colors"
            >
              Get a Quote
              <span className="text-xs font-normal text-white/85 mt-1">
                Tell us where your package is going and how quickly you need it delivered.
              </span>
            </Link>
            <Link
              to="/track"
              className="inline-flex flex-col items-center px-8 py-4 border-2 border-white/70 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Track Shipment
              <span className="text-xs font-normal text-white/70 mt-1">
                Already shipped? Enter your tracking number and follow your package.
              </span>
            </Link>
          </div>
          <p className="mt-12 text-lg font-semibold tracking-wide text-white/90">
            Fast Delivery Starts With <span className="text-[#ff8f00]">ShipNex.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
