"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from 'next/image'
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Packages", href: "#packages" },
    { name: "Gallery", href: "#gallery" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#12372A] border-[#ADBC9F]/20 shadow-lg py-2.5"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo Brand PNG */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => handleNavClick("#home")}
        >
          <Image
            src="/Logo DhilTrip.png"
            alt="Dhil Trip Logo"
            width = {794}
            height = {333}
            loading="eager"
            className={`w-auto object-contain transition-all duration-300 group-hover:scale-105 ${
              scrolled ? "h-11" : "h-14"
            }`}
          />
        </div>

        {/* Desktop Nav - REVERSED COLORS */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className={`text-sm font-medium transition-colors duration-300 ${
                scrolled
                  ? "text-[#FBFADA]/80 hover:text-white"
                  : "text-white/75 hover:text-white"
              }`}
            >
              {link.name}
            </button>
          ))}
          <Link href="/" className="text-sm font-semibold text-[#FBFADA] hover:text-white transition-colors">
            Challenge
          </Link>
          <LanguageSwitcher />
          <button
            onClick={() => handleNavClick("#packages")}
            className="px-6 py-2.5 font-semibold rounded-full bg-[#FBFADA] text-[#12372A] transition-all duration-300 hover:bg-white hover:shadow-lg hover:-translate-y-0.5"
          >
            Book Now
          </button>
        </nav>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            className={`p-2 rounded-xl transition-colors duration-300 ${
              scrolled
                ? "text-[#FBFADA] hover:bg-white/10"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 w-[80vw] max-w-sm bg-[#12372A] z-50 p-6 shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <Image
                    src="/Logo DhilTrip.png"
                    alt="Dhil Trip Logo"
                    width={794}
                    height={333}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#FBFADA]/70 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links List */}
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-left text-lg font-medium text-[#FBFADA] hover:text-white py-2 border-b border-[#ADBC9F]/20 transition-colors"
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              {/* Action Button inside Drawer */}
              <div className="mt-auto space-y-3">
                <Link
                  href="/"
                  className="block w-full py-4 text-center border border-[#FBFADA]/40 text-[#FBFADA] font-semibold rounded-2xl"
                >
                  Join the Challenge
                </Link>
                <button
                  onClick={() => handleNavClick("#packages")}
                  className="w-full py-4 bg-[#FBFADA] text-[#12372A] font-semibold rounded-2xl hover:bg-white transition-colors shadow-lg shadow-black/10"
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}