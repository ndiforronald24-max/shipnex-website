import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Send failed');
      setSubmitted(true);
    } catch {
      setError('We could not send your message right now. Please email us directly at support@shipnex.com.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80" alt="Business communication" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">Get in touch with our support team</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-white rounded-2xl shadow-md card-lift border border-gray-100">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#ff6f00]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-sm text-gray-500">support@shipnex.com</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-md card-lift border border-gray-100">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-[#ff6f00]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Phone</h3>
              <p className="text-sm text-gray-500">+1 (800) SHIP-NEX</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-md card-lift border border-gray-100">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-[#ff6f00]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Address</h3>
              <p className="text-sm text-gray-500">Global headquarters with offices worldwide</p>
            </div>
          </div>

          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
            {submitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                <p className="text-gray-500">We will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" placeholder="How can we help?" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                  <textarea placeholder="Tell us about your shipping needs..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none transition-all resize-none" />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                )}
                <button type="submit" disabled={sending} className="w-full py-3.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-60">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
