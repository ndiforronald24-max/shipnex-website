import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const services = [
    { path: '/services/air-freight', label: 'Air Freight' },
    { path: '/services/sea-freight', label: 'Sea Freight' },
    { path: '/services/road-freight', label: 'Road Freight' },
    { path: '/services/express-shipping', label: 'Express Shipping' },
    { path: '/services/vehicle-shipping', label: 'Vehicle Shipping' },
    { path: '/services/pet-live-animal', label: 'Pet Transport' },
    { path: '/services#warehousing', label: 'Warehousing' },
    { path: '/services#customs-support', label: 'Customs Support' },
  ];

  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/services', label: 'Services' },
    { path: '/offices', label: 'Global Offices' },
    { path: '/contact', label: 'Contact' },
  ];

  const support = [
    { path: '/track', label: 'Track Shipment' },
    { path: '/track/pet', label: 'Pet Tracking' },
    { path: '/faqs', label: 'FAQs' },
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-[#0d1b69] text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="inline-block mb-5 group">
              <img
                src="/brand/shipnex-wordmark-light.png"
                alt="ShipNex"
                width={720}
                height={147}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">Your trusted partner for fast reliable shipping and logistics solutions worldwide. Connecting the world moving what matters.</p>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Mail className="w-4 h-4 text-[#ff6f00]" />
              <span>support@shipnex.com</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-[#ff6f00] text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {services.map(s => (
                <li key={s.path}><Link to={s.path} className="hover:text-white transition-colors">{s.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-[#ff6f00] text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {quickLinks.map(l => (
                <li key={l.path}><Link to={l.path} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <h3 className="font-semibold mt-6 mb-5 text-[#ff6f00] text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {support.map(s => (
                <li key={s.path}><Link to={s.path} className="hover:text-white transition-colors">{s.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-[#ff6f00] text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[#ff6f00] mt-0.5 flex-shrink-0" /><span>Global headquarters with offices worldwide</span></li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#ff6f00] flex-shrink-0" /><span>+1 (800) SHIP-NEX</span></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#ff6f00] flex-shrink-0" /><span>support@shipnex.com</span></li>
            </ul>
            <div className="mt-6">
              <Link to="/track" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">Track Shipment</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">&copy; 2026 ShipNex. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
