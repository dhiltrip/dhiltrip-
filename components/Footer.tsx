"use client";

import { Leaf, Camera } from "lucide-react";

export function Footer() {
  const handleScrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#0B2119] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => handleScrollTo("#home")}>
              <div className="bg-accent/20 p-2 rounded-xl text-accent">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="font-sora font-bold text-2xl tracking-tight">
                Dhil Trip
              </span>
            </div>
            <p className="text-white/70 mb-8 leading-relaxed">
              Sustainable healing tourism in Yogyakarta. Reconnecting travelers with nature, themselves, and local communities.
            </p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }}>
              <input 
                type="email" 
                placeholder="Join newsletter" 
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white placeholder:text-white/40"
                required
              />
              <button className="bg-accent text-[#0B2119] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors">
                Join
              </button>
            </form>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-sora font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'Packages', 'Gallery', 'Testimonials', 'FAQ', 'Contact'].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => handleScrollTo(`#${link.toLowerCase() === 'home' ? 'home' : link.toLowerCase()}`)}
                    className="text-white/70 hover:text-accent transition-colors"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-sora font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms & Conditions', 'Cookie Policy', 'Cancellation Policy'].map((link) => (
                <li key={link}>
                  <button className="text-white/70 hover:text-accent transition-colors">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Column (Only Instagram Camera Icon) */}
          <div>
            <h4 className="font-sora font-bold text-lg mb-6">Connect</h4>
            <div className="flex gap-4 mb-8">
              <a 
                href="https://instagram.com/dhiltrip" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent hover:text-[#0B2119] transition-colors"
              >
                <Camera className="w-5 h-5" />
              </a>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-accent" /> Sustainable Development
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                Proudly supporting SDGs: Good Health & Well-being, Quality Education, and Responsible Consumption.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Dhil Trip Explorations. All rights reserved.
          </p>
<p className="text-white/50 text-sm flex items-center gap-1">
  Made with <span className="text-rose-500">❤️</span> by{" "}
  <a 
    href="https://vynzio.co" 
    target="_blank" 
    rel="follow" 
    className="hover:underline text-white/80 transition-colors"
  >
    Vynzio.co
  </a>
</p>
        </div>
      </div>
    </footer>
  );
}
