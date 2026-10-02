import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, Clock, ArrowRight, Plane, Ship, Heart, Globe, CheckCircle, Search, Shield, MapPin, Star } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import GlobalNetworkMap from '../components/GlobalNetworkMap';

export default function HomePage() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const envelope = await apiClient.publicTrack(trackingNumber.trim());
      const data = envelope && envelope.result ? envelope.result : envelope;
      if (!data || !data.trackingNumber) {
        setTrackError("We couldn't find a shipment with that tracking number. Please check the number and try again.");
        return;
      }
      setTrackResult(data);
      const type = envelope && envelope.type === 'pet' ? 'pet' : 'shipment';
      navigate('/track' + (type === 'pet' ? '/pet' : '') + '?tn=' + encodeURIComponent(trackingNumber.trim()));
    } catch (err: any) {
      setTrackError(err.response?.data?.message || "We couldn't find a shipment with that tracking number. Please check the number and try again.");
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section - Redesigned with real photography */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-cargo.svg" alt="Cargo plane being loaded at airport" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Trusted by 50,000+ customers worldwide
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Connecting the World.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6f00] to-[#ff8f00]">Moving What Matters.</span>
              </h1>
              <p className="text-lg text-gray-200 mb-8 max-w-lg leading-relaxed">
                Reliable global shipping, logistics, freight and pet transportation with secure shipment tracking every step of the way.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/track" className="px-7 py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">Track Your Shipment</Link>
                <Link to="/services" className="px-7 py-3.5 border-2 border-white/30 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm">Explore Our Services</Link>
              </div>
            </div>
            <div className="hidden lg:block animate-slide-in-right">
              <div className="glass rounded-2xl p-8 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white mb-2">Quick Track</h3>
                <p className="text-gray-300 text-sm mb-6">Enter your tracking number for instant updates</p>
                <div className="absolute -top-4 -right-4 bg-white/20 p-3 rounded-full">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white/20 p-3 rounded-full">
                  <Ship className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-1/2 -right-8 bg-white/20 p-3 rounded-full">
                  <Truck className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

          <div className="mt-12 max-w-2xl mx-auto">
            <form onSubmit={handleTrack} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter tracking number (e.g., USP-2026-458921)" className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#ff6f00] outline-none" />
              </div>
              <button type="submit" disabled={trackLoading} className="px-8 py-4 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors disabled:opacity-50">{trackLoading ? 'Tracking...' : 'Track'}</button>
            </form>
            {trackError && <p className="mt-3 text-red-300 text-sm">{trackError}</p>}
            {trackResult && (
              <div className="mt-4 bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-gray-300">Status</p><p className="font-bold">{trackResult.status || trackResult.result?.status || 'In Transit'}</p></div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
            )}
          </div>
      
      {/* Services Section with real images */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#ff6f00] font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">Comprehensive Logistics Solutions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From air freight to pet transport we provide end-to-end shipping solutions</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Plane, title: 'Air Freight', desc: 'For shipments that cannot wait, combining speed, security and visibility at every step.', img: '/images/air-freight-cover.svg', link: '/services/air-freight' },
              { icon: Ship, title: 'Sea Freight', desc: 'For cargo too big or too heavy to send by air, from containers to machinery.', img: '/images/sea-freight-cover.svg', link: '/services/sea-freight' },
              { icon: Truck, title: 'Road Freight', desc: 'Moving goods by truck or van, locally or across a border, wherever ships and planes cannot reach.', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80', link: '/services/road-freight' },
              { icon: Clock, title: 'Express Shipping', desc: 'For urgent documents, personal packages and time-sensitive items that need to move without delay.', img: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80', link: '/services/express-shipping' },
              { icon: Package, title: 'Vehicle Shipping', desc: 'For cars, SUVs, motorcycles and vans, coordinated locally and internationally.', img: '/images/vehicle-shipping.svg', link: '/services/vehicle-shipping' },
              { icon: Heart, title: 'Pet Transport', desc: 'Helping families coordinate safe, comfortable journeys for their animals.', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80', link: '/services/pet-live-animal' },
            ].map((service, i) => (
              <Link key={i} to={service.link} className="group card-lift bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-48 overflow-hidden relative">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover img-zoom" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center shadow-lg">
                    <service.icon className="w-6 h-6 text-[#ff6f00]" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-[#ff6f00] transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{service.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[#ff6f00] text-sm font-semibold group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why ShipNexaro */}
      <section className="py-16"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">Why Choose ShipNexaro</h2><p className="text-gray-600 max-w-2xl mx-auto">Industry-leading logistics solutions backed by technology and trust</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{[{ icon: Globe, title: 'Global Network', desc: 'Delivering to 200+ countries' },{ icon: Shield, title: 'Secure Transportation', desc: 'Full insurance coverage' },{ icon: MapPin, title: 'Shipment Tracking', desc: 'Real-time tracking updates' },{ icon: Clock, title: 'Professional Support', desc: '24/7 customer support' },{ icon: CheckCircle, title: 'Reliable Delivery', desc: '99.5% on-time rate' },{ icon: Heart, title: 'Pet-Friendly Services', desc: 'Specialized pet transport' }].map((feature, i) => (<div key={i} className="flex gap-4 p-6 rounded-xl bg-white shadow-md border border-gray-100"><div className="w-12 h-12 bg-[#ff6f00]/10 rounded-lg flex items-center justify-center flex-shrink-0"><feature.icon className="w-6 h-6 text-[#ff6f00]" /></div><div><h3 className="font-semibold text-base mb-1">{feature.title}</h3><p className="text-sm text-gray-600">{feature.desc}</p></div></div>))}</div></div></section>

      {/* Global Network Coverage */}
      <section className="py-16 bg-[#1a237e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold uppercase tracking-widest mb-4">
                <Globe className="w-4 h-4 text-[#ff8f00]" />
                Where We Operate
              </div>
              <h2 className="text-3xl font-bold mb-4">Global Network Coverage</h2>
              <p className="text-gray-200 mb-6 mx-auto max-w-2xl">With operations spanning six continents, ShipNexaro delivers to more than 200 countries worldwide.</p>
              <div className="grid grid-cols-2 gap-4 mb-8">{[{ stat: '200+', label: 'Countries' },{ stat: '50K+', label: 'Customers' },{ stat: '99.5%', label: 'On-time Rate' },{ stat: '24/7', label: 'Support' }].map((item, i) => (<div key={i} className="bg-white/10 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-[#ff6f00]">{item.stat}</p><p className="text-sm text-gray-300">{item.label}</p></div>))}</div>
              <Link to="/offices" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6f00] rounded-lg font-semibold hover:bg-[#e65100] transition-colors">Explore Global Offices <ArrowRight className="w-5 h-5" /></Link>
            </div>
          </div>
          <GlobalNetworkMap />
        </div>
      </section>

      {/* Pet Section */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid md:grid-cols-2 gap-12 items-center"><div className="order-2 md:order-1 hidden md:flex justify-center"><div className="w-72 h-72 bg-white rounded-full shadow-lg flex items-center justify-center"><Heart className="w-32 h-32 text-[#ff6f00]" /></div></div><div className="order-1 md:order-2"><h2 className="text-3xl font-bold mb-4">Your Pet's Journey Matters</h2><p className="text-gray-600 mb-4">We understand that pets are family. Our specialized pet transportation services ensure your furry companions travel safely.</p><ul className="space-y-3 mb-8">{['Certified pet handlers', 'Climate-controlled transport', '24/7 health monitoring', 'Door-to-door service', 'Vaccination verification'].map((item, i) => (<li key={i} className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /><span className="text-gray-700">{item}</span></li>))}</ul><div className="flex flex-wrap gap-4"><Link to="/services/pet-live-animal" className="px-6 py-3 bg-[#ff6f00] text-white rounded-lg font-semibold hover:bg-[#e65100] transition-colors">Explore Pet Transportation</Link><Link to="/track/pet" className="px-6 py-3 border-2 border-[#1a237e] text-[#1a237e] rounded-lg font-semibold hover:bg-[#1a237e] hover:text-white transition-colors">Track Pet Shipment</Link></div></div></div></div></section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#ff6f00] font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Simple transparent shipping process from start to finish</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: '1', title: 'Shipment Registered', desc: 'Create your shipment online or via our app' },
              { step: '2', title: 'Picked Up', desc: 'We collect from your location at scheduled time' },
              { step: '3', title: 'In Transit', desc: 'Your shipment is on the move with live tracking' },
              { step: '4', title: 'At Destination', desc: 'Arrived at destination facility for processing' },
              { step: '5', title: 'Delivered', desc: 'Delivered to recipient with confirmation' },
            ].map((item, i) => (
              <div key={i} className="text-center relative group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">{item.step}</div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
                {i < 4 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#1a237e]/20 to-transparent"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#1a237e] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6f00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#ff6f00] font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', role: 'Business Owner', text: 'ShipNexaro has been our go-to logistics partner for 3 years. Their air freight service is incredibly reliable.', rating: 5 },
              { name: 'David K.', role: 'Pet Owner', text: 'I was nervous about transporting my Golden Retriever overseas but ShipNexaro made the process seamless.', rating: 5 },
              { name: 'Maria L.', role: 'E-commerce Seller', text: 'Their sea freight options have helped us cut shipping costs by 40%. The team is always responsive.', rating: 5 },
            ].map((t, i) => (
              <div key={i} className="glass rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex gap-1 mb-4">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="w-4 h-4 fill-[#ff6f00] text-[#ff6f00]" />))}</div>
                <p className="text-gray-200 mb-6 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] flex items-center justify-center text-white font-bold text-sm">{t.name[0]}</div>
                  <div><p className="text-white font-semibold text-sm">{t.name}</p><p className="text-gray-400 text-xs">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 bg-gray-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2></div><div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">{[{ q: 'How do I track my shipment?', a: 'Enter your tracking number on our tracking page for real-time updates.' },{ q: 'What services do you offer?', a: 'We offer air, sea, road freight, express shipping, vehicle transport, and pet transportation.' },{ q: 'How long does international shipping take?', a: 'Delivery times vary: Express (2-5 days), Air (3-7 days), Sea (14-45 days).' },{ q: 'Do you ship pets internationally?', a: 'Yes, we specialize in safe international pet transportation.' }].map((faq, i) => (<div key={i} className="bg-white p-6 rounded-xl shadow-md"><h3 className="font-semibold mb-2">{faq.q}</h3><p className="text-sm text-gray-600">{faq.a}</p></div>))}</div><div className="text-center mt-8"><Link to="/faqs" className="inline-flex items-center gap-2 text-[#ff6f00] font-semibold hover:gap-3 transition-all">View All FAQs <ArrowRight className="w-5 h-5" /></Link></div></div></section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Ship With Confidence?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Our logistics experts are ready to assist you with any questions or custom shipping needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="px-8 py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">Get a Quote <ArrowRight className="w-5 h-5 inline ml-1" /></Link>
            <Link to="/register" className="px-8 py-3.5 border-2 border-[#1a237e] text-[#1a237e] rounded-xl font-semibold hover:bg-[#1a237e] hover:text-white transition-all">Create Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
