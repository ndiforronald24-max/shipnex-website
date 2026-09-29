import { Link } from 'react-router-dom';
import { Package, Truck, Globe, Clock, Shield, Heart, Plane, Ship, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    { icon: Plane, title: 'Air Freight', desc: 'Fast reliable air cargo for time-sensitive shipments. Our global network ensures your cargo reaches its destination quickly and safely with real-time tracking.', link: '/services/air-freight', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?auto=format&fit=crop&w=600&q=80' },
    { icon: Ship, title: 'Sea Freight', desc: 'Cost-effective ocean freight for large shipments. Full container and less-than-container load options with port-to-port and door-to-door service.', link: '/services/sea-freight', img: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=600&q=80' },
    { icon: Truck, title: 'Road Freight', desc: 'Reliable ground transportation across regions. FTL and LTL options with GPS tracking and guaranteed delivery windows.', link: '/services/road-freight', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80' },
    { icon: Clock, title: 'Express Shipping', desc: 'Time-critical deliveries with priority handling. Same-day and next-day options available in select metropolitan areas.', link: '/services/express-shipping', img: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80' },
    { icon: Package, title: 'Vehicle Shipping', desc: 'Secure vehicle transport with full insurance coverage. Enclosed and open carrier options for cars trucks and motorcycles.', link: '/services/vehicle-shipping', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afe?auto=format&fit=crop&w=600&q=80' },
    { icon: Heart, title: 'Pet & Live Animal Transport', desc: 'Safe climate-controlled pet transportation with certified handlers. 24/7 health monitoring and veterinary support throughout the journey.', link: '/services/pet-live-animal', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80' },
    { icon: Shield, title: 'Warehousing', desc: 'Secure storage facilities with inventory management order fulfillment and distribution services. Climate-controlled options available.', link: '/services', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80' },
    { icon: Globe, title: 'Customs Support', desc: 'Expert customs clearance and documentation services. We handle all import/export regulations to ensure smooth cross-border shipping.', link: '/services', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80' },
  ];

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
                  <span className="inline-flex items-center gap-1 text-[#ff6f00] text-sm font-semibold group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
