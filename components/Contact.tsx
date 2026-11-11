"use client";

import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Camera, Send } from "lucide-react";
import { packages, whatsappLink, WHATSAPP_NUMBER } from "@/data/challenge";

const fieldClass =
  "w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200";

const contacts = [
  { label: "WhatsApp", value: "+62 822 3468 0849", href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: Phone },
  { label: "Email", value: "dhiltrip@gmail.com", href: "mailto:dhiltrip@gmail.com", icon: Mail },
  { label: "Location", value: "Yogyakarta, Indonesia", icon: MapPin },
  { label: "Instagram", value: "@dhiltrip", href: "https://instagram.com/dhiltrip", icon: Camera },
];

export function Contact() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const message = [
      "Hello Dhil Trip,",
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone")}`,
      `Interested package: ${data.get("package")}`,
      "",
      `${data.get("message")}`,
    ].join("\n");
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  };

  return (
    <section id="contact" className="py-24 bg-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[100px] opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-primary-foreground"
          >
            <h2 className="text-4xl md:text-5xl font-sora font-bold mb-6">Let&apos;s Plan Your Journey</h2>
            <p className="text-primary-foreground/80 text-lg mb-12 max-w-md">
              Ready to heal, explore, and grow? Reach out to us to book a package or create a custom experience.
            </p>

            <div className="space-y-8">
              {contacts.map(({ label, value, href, icon: Icon }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-foreground/60 font-medium mb-1">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-lg font-semibold hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-lg font-semibold">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl inline-block backdrop-blur-sm">
              <p className="font-medium text-accent">🍃 Available 24/7 for inquiries</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                <input id="contact-name" name="name" required type="text" autoComplete="name" className={fieldClass} placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-foreground mb-2">Email</label>
                  <input id="contact-email" name="email" required type="email" autoComplete="email" className={fieldClass} placeholder="john@example.com" />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                  <input id="contact-phone" name="phone" required type="tel" autoComplete="tel" className={fieldClass} placeholder="+62 812..." />
                </div>
              </div>

              <div>
                <label htmlFor="contact-package" className="block text-sm font-semibold text-foreground mb-2">Interested Package</label>
                <select id="contact-package" name="package" required defaultValue="" className={`${fieldClass} appearance-none`}>
                  <option value="" disabled>Select a package...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.title}>{pkg.title}</option>
                  ))}
                  <option value="Custom / Corporate Retreat">Custom / Corporate Retreat</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-foreground mb-2">Message</label>
                <textarea id="contact-message" name="message" required rows={4} className={`${fieldClass} resize-none`} placeholder="Tell us about your group, dates, or specific needs..." />
              </div>

              <button className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                Continue on WhatsApp <Send className="w-5 h-5" />
              </button>
              <p className="text-center text-xs text-muted-foreground">Your message opens in WhatsApp, ready to send.</p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
