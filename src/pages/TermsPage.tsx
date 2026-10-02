export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
        <p>Last updated: September 1, 2026</p>
        <h2 className="text-xl font-semibold text-gray-800">Acceptance of Terms</h2>
        <p>By using ShipNexaro services, you agree to these terms and conditions.</p>
        <h2 className="text-xl font-semibold text-gray-800">Services</h2>
        <p>ShipNexaro provides package shipping, pet transportation, and logistics services. All services are subject to availability and applicable laws.</p>
        <h2 className="text-xl font-semibold text-gray-800">Prohibited Items</h2>
        <p>Hazardous materials, illegal substances, and items prohibited by law cannot be shipped through our network.</p>
        <h2 className="text-xl font-semibold text-gray-800">Liability</h2>
        <p>ShipNexaro is liable for loss or damage during transit up to the declared value of the shipment. Additional insurance is available.</p>
        <h2 className="text-xl font-semibold text-gray-800">Contact</h2>
        <p>For questions about these terms, contact legal@shipnexaro.com.</p>
      </div>
    </div>
  );
}
