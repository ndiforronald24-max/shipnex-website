import { Link } from 'react-router-dom';
import { Car, Globe, ShieldCheck, MapPin, ClipboardCheck, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Car, title: 'Multiple Vehicle Types', desc: 'We arrange transportation solutions for cars, SUVs, motorcycles, vans and other eligible vehicles.' },
  { icon: Globe, title: 'Local & International Shipping', desc: 'Move a vehicle between cities and regions, or to an international destination, with the paperwork organised for you.' },
  { icon: ShieldCheck, title: 'Careful Transportation', desc: 'Your vehicle is handled as valuable cargo at every stage, so it arrives looking the way it did when it was collected.' },
  { icon: MapPin, title: 'Shipment Visibility', desc: 'Follow your vehicle\u2019s transportation progress from pickup to delivery using your tracking number.' },
  { icon: ClipboardCheck, title: 'Professional Coordination', desc: 'We organise the shipping process and the requirements your vehicle needs, so nothing is missed at either end.' },
];

/** Short bulleted list rendered as chips under "Vehicles We Ship". */
const suitedTo = [
  'Cars',
  'SUVs',
  'Motorcycles',
  'Vans',
  'Commercial vehicles',
  'Imported vehicles',
  'Relocated vehicles',
];

export default function VehicleShippingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Move Your Vehicle <span className="text-[#ff6f00]">With Confidence</span>
              </h1>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                Transporting a vehicle is different from shipping an ordinary package. Your vehicle is valuable, and it deserves professional care throughout its journey.
              </p>
              <p className="text-base text-gray-300 mb-8 leading-relaxed">
                ShipNexaro provides vehicle shipping solutions for cars, SUVs, motorcycles, vans and other eligible vehicles, helping customers coordinate transportation locally and internationally.
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
                <Car className="w-32 h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Vehicle Shipping?</h2>
          <p className="text-gray-600 leading-relaxed">
            Vehicle shipping moves a whole vehicle rather than a parcel. Your car, van or motorcycle is collected, loaded onto a car carrier or trailer, driven or sailed to its destination and unloaded there, without anyone needing to drive it there themselves.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNexaro Vehicle Shipping? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNexaro Vehicle Shipping?</h2>
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
                Rather than invent a sixth claim (insurance levels, carrier
                types), this cell routes the reader to a real conversation. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <Car className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">Not Sure If We Can Help?</h3>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">
                Send us your vehicle details and route, and we will confirm what is possible.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff8f00] hover:text-white transition-colors">
                Ask our vehicle team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles We Ship */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Vehicles We Ship</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            If you need to move a vehicle but not drive it there yourself, we can arrange it.
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
          <h2 className="text-3xl font-bold mb-4">Your Vehicle. Our Responsibility.</h2>
          <p className="text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Whether you are buying a vehicle overseas, relocating, selling a vehicle, or transporting one for business, ShipNexaro helps make the journey easier to manage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex flex-col items-center px-8 py-4 bg-[#ff6f00] rounded-xl font-semibold hover:bg-[#e65100] transition-colors"
            >
              Get a Quote
              <span className="text-xs font-normal text-white/85 mt-1">
                Tell us about your vehicle, pickup location, destination and preferred method.
              </span>
            </Link>
            <Link
              to="/track"
              className="inline-flex flex-col items-center px-8 py-4 border-2 border-white/70 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Track Shipment
              <span className="text-xs font-normal text-white/70 mt-1">
                Already shipped your vehicle? Follow its progress with your tracking number.
              </span>
            </Link>
          </div>
          <p className="mt-12 text-lg font-semibold tracking-wide text-white/90">
            Drive Less. Worry Less. <span className="text-[#ff8f00]">ShipNexaro Moves Your Vehicle.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
