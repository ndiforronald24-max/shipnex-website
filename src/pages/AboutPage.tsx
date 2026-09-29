import { Shield, Globe, Clock, Users, Award, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1920&q=80" alt="Global logistics hub" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About ShipNex</h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">Connecting the world through reliable logistics and transportation solutions</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <span className="text-[#ff6f00] font-semibold text-sm uppercase tracking-wider">Our Story</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">To connect people and businesses through seamless logistics solutions. We ensure every package every pet reaches its destination safely and on time.</p>
              <p className="text-gray-600 leading-relaxed">Founded in 2020 ShipNex has grown to serve customers across 200+ countries with a network of certified handlers and state-of-the-art tracking technology.</p>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" alt="Modern warehouse facility" className="rounded-2xl shadow-xl w-full h-80 object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
            {[
              { icon: Globe, stat: '200+', label: 'Countries' },
              { icon: Users, stat: '50K+', label: 'Customers' },
              { icon: Clock, stat: '99.5%', label: 'On-time' },
              { icon: Shield, stat: '100%', label: 'Insured' },
              { icon: Award, stat: '24/7', label: 'Support' },
              { icon: Truck, stat: '500+', label: 'Vehicles' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-md card-lift border border-gray-100">
                <item.icon className="w-8 h-8 text-[#ff6f00] mx-auto mb-3" />
                <p className="text-2xl font-bold">{item.stat}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Ship?</h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-8">Join thousands of customers who trust ShipNex for their shipping needs.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/services" className="px-7 py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">Explore Services</Link>
              <Link to="/contact" className="px-7 py-3.5 border-2 border-[#1a237e] text-[#1a237e] rounded-xl font-semibold hover:bg-[#1a237e] hover:text-white transition-all">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
