import { Link } from 'react-router-dom';
import { Zap, Clock, Shield, Globe, ArrowRight } from 'lucide-react';

export default function ExpressShippingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Express <span className="text-[#ff6f00]">Shipping</span>
              </h1>
              <p className="text-lg text-gray-200 mb-8">
                Priority handling for time-sensitive shipments. Same-day and next-day delivery options available.
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

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Express Shipping?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: 'Same-Day', desc: 'Available in major cities' },
              { icon: Globe, title: 'Next-Day', desc: 'Nationwide coverage' },
              { icon: Shield, title: 'Priority Handling', desc: 'First on, first off' },
              { icon: Zap, title: 'Real-Time Updates', desc: 'Live tracking alerts' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md text-center">
                <feature.icon className="w-12 h-12 text-[#ff6f00] mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Express Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Same-Day Express', desc: 'Delivery within hours in metro areas', price: 'From $49.99' },
              { title: 'Next-Day Air', desc: 'Guaranteed next business day', price: 'From $29.99' },
              { title: 'Priority 2-Day', desc: 'Two-day guaranteed delivery', price: 'From $19.99' },
            ].map((service, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
                <p className="text-[#1a237e] font-bold">{service.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#1a237e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need It There Fast?</h2>
          <p className="text-gray-200 mb-8 max-w-2xl mx-auto">
            Our express shipping ensures your urgent shipments arrive on time.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors">
            Contact Us <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
