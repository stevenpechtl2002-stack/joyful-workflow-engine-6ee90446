import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500">
      {/* Decorative geometric shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large rounded triangle bottom-right */}
        <svg className="absolute -bottom-16 -right-16 w-80 h-80 opacity-30" viewBox="0 0 300 300">
          <path d="M50 280 L150 30 L280 260 Q280 290 250 290 L80 290 Q50 290 50 260Z" fill="#8B7355" />
        </svg>
        {/* Circle top-left */}
        <svg className="absolute -top-20 -left-20 w-64 h-64 opacity-20" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="#C4A35A" />
        </svg>
        {/* Small circle mid-right */}
        <svg className="absolute top-1/3 right-1/4 w-32 h-32 opacity-15" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#BE185D" />
        </svg>
        {/* Diagonal stripe accent */}
        <svg className="absolute bottom-0 left-1/4 w-96 h-48 opacity-10" viewBox="0 0 400 200">
          <rect x="0" y="60" width="400" height="30" rx="15" fill="#8B7355" transform="rotate(-12 200 100)" />
          <rect x="0" y="120" width="300" height="20" rx="10" fill="#C4A35A" transform="rotate(-12 150 130)" />
        </svg>
        {/* Small triangle top-right */}
        <svg className="absolute top-8 right-12 w-24 h-24 opacity-20" viewBox="0 0 100 100">
          <polygon points="50,10 90,85 10,85" fill="#9F7AEA" />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-black text-lg">Z</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                Zen<span className="text-white/80">Time</span>
              </span>
            </Link>
            <p className="text-white/70 max-w-md">
              Individuelle KI-Lösungen, Voice-Agents und Automatisierungen für
              Ihr Unternehmen. Wir bringen Ihre Prozesse auf das nächste Level.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li></li>
              <li>
                <Link to="/kontakt" className="text-white/70 hover:text-white transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70">
                <Mail className="w-4 h-4 text-white" />
                <span>steven.pechtl@nextgensmartsolution.de</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Phone className="w-4 h-4 text-white" />
                <span>+49 1520 4540077</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4 text-white" />
                <span>Deutschland</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm text-white/70">
            <Link to="/impressum" className="hover:text-white transition-colors">
              Impressum
            </Link>
            <Link to="/datenschutz" className="hover:text-white transition-colors">
              Datenschutz
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          <p className="text-sm text-white/70">
            © 2026 ZenTime. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
