import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Truck, Globe, Clock, Shield, Heart, Plane, Ship, ArrowRight, Warehouse, FileCheck, Boxes, Thermometer, PackageCheck, ClipboardCheck, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  link: string;
  img: string;
  /** Set for services that are anchored sections on this page. */
  anchor?: string;
}

const services: ServiceCard[] = [
  { icon: Plane, title: 'Air Freight', desc: 'For shipments that cannot wait. We combine speed, security, visibility at every step, and professional handling.', link: '/services/air-freight', img: '/images/air-freight-cover.svg' },
  { icon: Ship, title: 'Sea Freight', desc: 'For anything too big or too heavy to send by air. Containers, machinery, equipment and larger commercial cargo.', link: '/services/sea-freight', img: '/images/sea-freight-cover.svg' },
  { icon: Truck, title: 'Road Freight', desc: 'Moving goods by truck or van, locally or across a border. The most flexible way to reach places ships and planes cannot.', link: '/services/road-freight', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80' },
  { icon: Clock, title: 'Express Shipping', desc: 'For urgent documents, personal packages, business orders and time-sensitive items that need to move without delay.', link: '/services/express-shipping', img: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80' },
  { icon: Package, title: 'Vehicle Shipping', desc: 'For cars, SUVs, motorcycles, vans and other eligible vehicles, coordinated locally and internationally.', link: '/services/vehicle-shipping', img: '/images/vehicle-shipping.svg' },
  { icon: Heart, title: 'Pet & Live Animal Transport', desc: 'Helping families coordinate safe, comfortable journeys for their animals, whether across the country or internationally.', link: '/services/pet-live-animal', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80' },
  { icon: Warehouse, title: 'Warehousing', desc: 'Secure storage facilities with inventory management order fulfillment and distribution services. Climate-controlled options available.', link: '/services#warehousing', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80', anchor: 'warehousing' },
  { icon: Globe, title: 'Customs Support', desc: 'Expert customs clearance and documentation services. We handle all import/export regulations to ensure smooth cross-border shipping.', link: '/services#customs-support', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', anchor: 'customs-support' },
];

/** In-page sections rendered below the card grid, keyed by anchor id. */
const anchoredSections: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  img: string;
  icon: LucideIcon;
  points: { icon: LucideIcon; title: string; desc: string }[];
  cta: { label: string; to: string };
}[] = [
  {
    id: 'warehousing',
    eyebrow: 'Warehousing & Fulfilment',
    title: 'Warehousing',
    intro:
      'Flexible storage and fulfilment across our global facility network. Receive, store, pick, pack and dispatch inventory with real-time visibility from a single dashboard.',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    icon: Warehouse,
    points: [
      { icon: Boxes, title: 'Inventory Management', desc: 'Real-time stock levels, cycle counting and bin-level accuracy across every location.' },
      { icon: PackageCheck, title: 'Pick & Pack Fulfilment', desc: 'Same-day order processing with barcode scanning and quality checks before dispatch.' },
      { icon: Thermometer, title: 'Climate-Controlled', desc: 'Temperature-managed zones for pharmaceuticals, electronics and perishable goods.' },
      { icon: Send, title: 'Distribution', desc: 'Scheduled outbound deliveries and cross-dock transfers between regional hubs.' },
    ],
    cta: { label: 'Talk to a warehousing specialist', to: '/contact' },
  },
  {
    id: 'customs-support',
    eyebrow: 'Border Compliance',
    title: 'Customs Support',
    intro:
      'Licensed customs brokers in every major market. We prepare, file and track your clearance paperwork so shipments move through the border without delays or penalties.',
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    icon: Globe,
    points: [
      { icon: ClipboardCheck, title: 'Entry Filing', desc: 'Accurate customs declarations submitted electronically with duty and tax optimisation.' },
      { icon: FileCheck, title: 'HS Code Classification', desc: 'Expert tariff classification to reduce risk of misdeclaration and surprise charges.' },
      { icon: Shield, title: 'Compliance Advisory', desc: 'Guidance on restricted goods, licences, quotas and origin documentation.' },
      { icon: Clock, title: 'Border Monitoring', desc: 'Proactive status tracking so you hear about holds before they slow you down.' },
    ],
    cta: { label: 'Get customs support', to: '/contact' },
  },
];

/** Offset for the sticky site header when jumping to an anchor. */
const ANCHOR_OFFSET_PX = 96;

export default function ServicesPage() {
  const { hash } = useLocation();

  // React Router does not scroll to hash targets for us, and the anchored
  // sections render after the first paint, so resolve the scroll by hand.
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET_PX;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [hash]);

  return (
    <div>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=1920&q=80" alt="Cargo ships at port" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">Comprehensive logistics solutions tailored to your shipping needs</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, i) => (
              <Link key={i} to={service.link} className="group card-lift bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#ff6f00]/30">
                <div className="h-40 overflow-hidden relative">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover img-zoom" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center shadow-lg">
                    <service.icon className="w-6 h-6 text-[#ff6f00]" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-[#ff6f00] transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{service.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[#ff6f00] text-sm font-semibold group-hover:gap-2 transition-all">
                    {service.anchor ? 'View details' : 'Learn more'} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Anchored detail sections: Warehousing and Customs Support */}
      {anchoredSections.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className={`py-20 scroll-mt-24 ${i % 2 === 1 ? 'bg-gradient-to-br from-gray-50 to-orange-50/30' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a237e]/5 text-[#1a237e] text-xs font-semibold uppercase tracking-widest mb-4">
                  <section.icon className="w-4 h-4 text-[#ff6f00]" />
                  {section.eyebrow}
                </div>
                <h2 id={`${section.id}-heading`} className="text-3xl md:text-4xl font-bold mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">{section.intro}</p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {section.points.map((point) => (
                    <div key={point.title} className="flex gap-3">
                      <div className="w-10 h-10 bg-[#ff6f00]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <point.icon className="w-5 h-5 text-[#ff6f00]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{point.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{point.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to={section.cta.to}
                  className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  {section.cta.label} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className={`relative ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src={section.img}
                    alt={`${section.title} at ShipNexaro`}
                    loading="lazy"
                    className="w-full h-72 sm:h-96 object-cover"
                  />
                </div>
                <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-xl border border-gray-100">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] rounded-xl flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{section.title}</p>
                    <p className="text-xs text-gray-500">Available on every major lane</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">Our logistics experts can design a shipping solution tailored to your specific requirements.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">
            Contact Us <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
