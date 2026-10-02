import { Link } from 'react-router-dom';
import { PawPrint, Heart, Globe, FileCheck, MapPin, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The five differentiators, in the order the copy introduces them. */
const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: PawPrint, title: 'Pet-Focused Handling', desc: 'We recognise that pets need their own handling and travel arrangements, not the same ones used for boxes and freight.' },
  { icon: Heart, title: 'Care & Comfort', desc: 'Your pet\u2019s wellbeing stays central to the journey, from the moment they are collected to the moment they arrive.' },
  { icon: Globe, title: 'Domestic & International Options', desc: 'We coordinate pet travel to a wide range of destinations, whether your pet is moving across the country or overseas.' },
  { icon: FileCheck, title: 'Travel Documentation Guidance', desc: 'International pet travel often needs health certificates, vaccinations and permits. We explain which requirements may apply to your route.' },
  { icon: MapPin, title: 'Dedicated Pet Tracking', desc: 'Pet tracking is built around your animal rather than a parcel, so you can follow your pet\u2019s journey at each step.' },
];

/** Short bulleted list rendered as chips under "We Can Help With". */
const suitedTo = [
  'Dogs',
  'Cats',
  'Other eligible companion animals',
  'Domestic pet transportation',
  'International pet transportation',
  'Travel documentation coordination',
  'Transportation planning',
];

export default function PetTransportPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Because Your Pet Is <span className="text-[#ff6f00]">Family, Not Cargo.</span>
              </h1>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                Moving a pet requires more than getting from one destination to another. It requires planning, care, attention and responsible handling.
              </p>
              <p className="text-base text-gray-300 mb-4 leading-relaxed">
                ShipNexaro Pet Transportation helps families and pet owners coordinate safe and comfortable journeys for their animals. Whether your pet is travelling across the country or internationally, our goal is to make the process easier for you and less stressful for your pet.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/contact" className="px-6 py-3 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors">
                  Get a Quote
                </Link>
                <Link to="/track/pet" className="px-6 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-[#1a237e] transition-colors">
                  Track Pet
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-80 h-80 bg-white/10 rounded-full flex items-center justify-center">
                <Heart className="w-32 h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is pet transportation - plain definition for first-time visitors */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What Is Pet Transportation?</h2>
          <p className="text-gray-600 leading-relaxed">
            Pet transportation moves a living animal rather than a parcel. Your pet travels with the space, climate and handling they need, whether the journey is a short drive or an international flight, and every stage is planned around their comfort and safety.
          </p>
        </div>
      </section>

      {/* Why Choose ShipNexaro Pet Transportation? */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShipNexaro Pet Transportation?</h2>
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
                Rather than invent a sixth claim, this cell gives the reader a
                way to ask the question the section raises. */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white flex flex-col justify-center">
              <PawPrint className="w-8 h-8 text-[#ff8f00] mb-3" />
              <h3 className="font-semibold text-lg mb-2">Not Sure What Your Pet Needs?</h3>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">
                Tell us your route and we will explain the requirements that apply.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff8f00] hover:text-white transition-colors">
                Ask our pet team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* We Can Help With */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">We Can Help With</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            From a single pet travelling to a new home to a full relocation, we coordinate the journey and the paperwork around it.
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

      <section className="py-20 bg-[#1a237e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">A Journey They Deserve</h2>
          <p className="text-gray-200 mb-4 max-w-2xl mx-auto leading-relaxed">
            Your pet is part of your family. That is why every journey deserves careful planning and responsible transportation.
          </p>
          <p className="text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            With ShipNexaro, you can focus on the destination while we help coordinate the journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex flex-col items-center px-8 py-4 bg-[#ff6f00] rounded-xl font-semibold hover:bg-[#e65100] transition-colors"
            >
              Get a Quote
              <span className="text-xs font-normal text-white/85 mt-1">
                Tell us about your pet, destination, preferred dates and requirements.
              </span>
            </Link>
            <Link
              to="/track/pet"
              className="inline-flex flex-col items-center px-8 py-4 border-2 border-white/70 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Track Pet Shipment
              <span className="text-xs font-normal text-white/70 mt-1">
                Already arranged your pet&rsquo;s journey? Follow their progress using pet tracking.
              </span>
            </Link>
          </div>
          <p className="mt-12 text-lg font-semibold tracking-wide text-white/90">
            Safe Journeys. Caring Service. <span className="text-[#ff8f00]">Happy Reunions.</span>
          </p>
          <p className="mt-2 text-sm text-white/60">ShipNexaro Pet Transportation</p>
          <p className="mt-4 text-base text-white/80">
            They travel with care. You travel with peace of mind.
          </p>
        </div>
      </section>
    </div>
  );
}
