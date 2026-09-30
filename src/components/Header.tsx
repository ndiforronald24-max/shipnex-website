import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('authToken');
  const servicesRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services', hasDropdown: true },
    { path: '/track', label: 'Track' },
    { path: '/track/pet', label: 'Pet Transport' },
    { path: '/offices', label: 'Offices' },
    { path: '/contact', label: 'Contact' },
  ];

  const servicesDropdown = [
    { path: '/services/air-freight', label: 'Air Freight' },
    { path: '/services/sea-freight', label: 'Sea Freight' },
    { path: '/services/road-freight', label: 'Road Freight' },
    { path: '/services/express-shipping', label: 'Express Shipping' },
    { path: '/services/vehicle-shipping', label: 'Vehicle Shipping' },
    { path: '/services/pet-live-animal', label: 'Pet & Live Animal' },
    { path: '/services#warehousing', label: 'Warehousing' },
    { path: '/services#customs-support', label: 'Customs Support' },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1a237e]/95 backdrop-blur-md shadow-xl'
          : 'bg-[#1a237e]'
      }`}
      role="banner"
    >
      {/* Top bar */}
      <div className="hidden lg:block bg-[#0d1b69] text-white/70 text-xs border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-8">
          <span>Global Shipping & Logistics Solutions</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> +1 (800) SHIP-NEX
            </span>
            <span>support@shipnex.com</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center group shrink-0" aria-label="ShipNex — home">
            <img
              src="/brand/shipnex-wordmark-light.png"
              alt="ShipNex"
              width={720}
              height={147}
              className="h-8 sm:h-9 lg:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(link => (
              <div key={link.path} className="relative" ref={link.hasDropdown ? servicesRef : null}>
                {link.hasDropdown ? (
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setServicesOpen(false); }}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/10 ${isActive(link.path) || location.pathname.startsWith('/services') ? 'text-[#ff6f00]' : ''}`}
                    aria-expanded={servicesOpen}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    to={link.path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/10 ${isActive(link.path) ? 'text-[#ff6f00]' : ''}`}
                  >
                    {link.label}
                  </Link>
                )}
                {link.hasDropdown && servicesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-2 z-50" role="menu">
                    {servicesDropdown.map(s => (
                      <Link key={s.path} to={s.path} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ff6f00] transition-colors" role="menuitem">
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/track" className="px-4 py-2 text-sm font-medium border border-white/30 rounded-lg hover:bg-white/10 transition-colors">
              Track Shipment
            </Link>
            {token ? (
              <Link to="/admin" className="px-4 py-2 bg-[#ff6f00] rounded-lg text-sm font-medium hover:bg-[#e65100] transition-colors">Dashboard</Link>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-[#ff6f00] rounded-lg text-sm font-medium hover:bg-[#e65100] transition-colors">Login</Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/10 mt-2 pt-4" role="navigation" aria-label="Mobile navigation">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <div key={link.path}>
                  {link.hasDropdown ? (
                    <>
                      <button onClick={() => setServicesOpen(!servicesOpen)} className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10" aria-expanded={servicesOpen}>
                        {link.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {servicesOpen && (
                        <div className="ml-4 mt-1 space-y-1">
                          {servicesDropdown.map(s => (
                            <Link key={s.path} to={s.path} className="block px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-white/10">{s.label}</Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link to={link.path} className={`block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 ${isActive(link.path) ? 'text-[#ff6f00]' : ''}`}>{link.label}</Link>
                  )}
                </div>
              ))}
              <div className="flex gap-3 mt-3 pt-3 border-t border-white/10">
                <Link to="/track" className="flex-1 text-center px-4 py-2.5 border border-white/30 rounded-lg text-sm font-medium">Track</Link>
                {token ? (
                  <Link to="/admin" className="flex-1 text-center px-4 py-2.5 bg-[#ff6f00] rounded-lg text-sm font-medium">Dashboard</Link>
                ) : (
                  <Link to="/login" className="flex-1 text-center px-4 py-2.5 bg-[#ff6f00] rounded-lg text-sm font-medium">Login</Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
