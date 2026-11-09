"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Camera, Send, CheckCircle2 } from "lucide-react";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    // Mock API call
    setTimeout(() => setStatus("success"), 1500);
  };

  return (
    <section id="contact" className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[100px] opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-primary-foreground"
          >
            <h2 className="text-4xl md:text-5xl font-sora font-bold mb-6">Let's Plan Your Journey</h2>
            <p className="text-primary-foreground/80 text-lg mb-12 max-w-md">
              Ready to heal, explore, and grow? Reach out to us to book a package or create a custom experience.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60 font-medium mb-1">WhatsApp</p>
                  <p className="text-lg font-semibold">+62 822 3468 0849</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60 font-medium mb-1">Email</p>
                  <p className="text-lg font-semibold">dhiltrip@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60 font-medium mb-1">Location</p>
                  <p className="text-lg font-semibold">Yogyakarta, Indonesia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Camera className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60 font-medium mb-1">Instagram</p>
                  <p className="text-lg font-semibold">@dhiltrip</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl inline-block backdrop-blur-sm">
              <p className="font-medium text-accent">🍃 Available 24/7 for inquiries</p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative"
          >
            {status === "success" ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-secondary mb-6" />
                </motion.div>
                <h3 className="text-3xl font-sora font-bold text-foreground mb-4">Message Sent!</h3>
                <p className="text-muted-foreground mb-8">We've received your inquiry and will get back to you within 24 hours.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                    <input
                      required
                      type="tel"
                      className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      placeholder="+62 812..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Interested Package</label>
                  <select
                    defaultValue=""
                    className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 appearance-none"
                    required
                  >
                    <option value="" disabled>Select a package...</option>
                    <option value="karimunjawa">Karimunjawa Healing Retreat</option>
                    <option value="wastebank">Urban Waste Bank Tour</option>
                    <option value="cultural">Cultural Immersion Package</option>
                    <option value="custom">Custom / Corporate Retreat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
                    placeholder="Tell us about your group, dates, or specific needs..."
                  ></textarea>
                </div>

                <button
                  disabled={status === "submitting"}
                  className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === "submitting" ? "Sending..." : (
                    <>
                      Send Message <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
