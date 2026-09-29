import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'How do I track my shipment?', a: 'Enter your tracking number on the Track Shipment page. You will see real-time updates on your package location and status.' },
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Express delivery takes 2-3 business days. International shipping varies by destination.' },
  { q: 'Do you ship pets?', a: 'Yes! We offer specialized pet transportation with climate-controlled vehicles and certified pet handlers.' },
  { q: 'Is my shipment insured?', a: 'All shipments are fully insured. Additional coverage is available for high-value items.' },
  { q: 'How much does shipping cost?', a: 'Cost depends on weight, dimensions, destination, and service type. Get a quote by creating a shipment.' },
  { q: 'Can I change my delivery address?', a: 'Yes, you can update the delivery address while the package is still in transit. Contact support for assistance.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h1>
      <p className="text-gray-500 text-center mb-12">Find answers to common questions about our services</p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left font-medium hover:bg-gray-50"
            >
              {faq.q}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <div className="px-6 pb-4 text-sm text-gray-600">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
