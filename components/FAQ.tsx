"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {client} from '@/sanity/lib/client'

type faq = { 
  _id: string 
  question: string 
  answer: string 
}

const faqsQuery = `*[_type == "faq"] | order(_createdAt asc) {
    _id,
    question,
    answer,
}`

const faqs = [
  {
    q: "What makes Dhil Trip different from regular travel agencies?",
    a: "We integrate healing, sustainability, and cultural education. Every trip includes journaling sessions, eco-challenges, and meaningful community interactions — not just sightseeing."
  },
  {
    q: "Who are these trips for?",
    a: "Our trips are designed for university students, young professionals, school groups, and anyone seeking more meaningful travel experiences."
  },
  {
    q: "What is an eco-challenge?",
    a: "Participants collect waste during the trip using our eco-friendly telo bags. It's a fun, hands-on way to contribute to a cleaner environment."
  },
  {
    q: "What is included in the package price?",
    a: "Accommodation (for multi-day trips), meals, transportation, guide fees, eco-challenge kit, journaling materials, and a participation certificate."
  },
  {
    q: "How do I book a trip?",
    a: "You can book directly via our WhatsApp Business or Instagram @dhiltrip. We'll guide you through the registration and payment process."
  },
  {
    q: "Can companies book for team retreats?",
    a: "Yes! We offer customized corporate packages for team-building and employee wellness retreats. Contact us for a tailored quote."
  },
  {
    q: "What happens after the trip?",
    a: "Participants receive a certificate of participation, trip documentation, and access to our post-trip community for continued connection."
  },
  {
    q: "Is there a cancellation policy?",
    a: "We understand plans change. Please contact us at least 7 days before the trip for cancellation or rescheduling options."
  }
];

export function FAQ() {
  const [faqs, setFaqs] = useState<faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchFaqs() {
      try {
        const data = await client.fetch<faq[]>(faqsQuery);
        if (!cancelled) setFaqs(data ?? []);
      } catch (err) {
        console.error('Failed to fetch FAQs:', err);
        if (!cancelled) setError('Unable to load FAQs. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFaqs();
    return () => { cancelled = true; };
  }, []);

  {loading && <p className="text-center">Loading FAQs...</p>}
  
  {error && <p className="text-center text-red-600">{error}</p>}
  
  {!loading && !error && faqs.length === 0 && (<p className="text-center">No FAQs available yet.</p>)}

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-sora font-bold text-foreground mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Everything you need to know about traveling with us.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                key={faq._id}
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                  isOpen ? "bg-background border-primary/20 shadow-md" : "bg-white border-border hover:border-primary/30"
                }`}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span className={`font-semibold text-lg transition-colors ${isOpen ? "text-primary" : "text-foreground"}`}>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`shrink-0 ml-4 p-1 rounded-full ${isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
