"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2, ChevronDown, Loader2, Mail, MapPin, Phone, Quote, Send, Star, X } from "lucide-react";
import { AutoScrollStrip } from "@/components/AutoScrollStrip";
import { WHATSAPP_NUMBER, whatsappLink } from "@/data/challenge";
import { faqs } from "@/data/site";
import { averageRating } from "@/data/content";
import { focusStyle } from "@/data/focus";
import { useArticles, useMemories, useReviews } from "@/lib/site-content";
import { ArticleList } from "@/components/ArticleList";
import { Stars } from "@/components/Stars";
import { emailCopyEnabled, sendEmailCopy } from "@/lib/send-email";

const heading = "title-section text-center text-black";
const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

const contacts = [
  { label: "WhatsApp", value: "+62 822 3468 0849", href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: Phone },
  { label: "Email", value: "dhiltrip@gmail.com", href: "mailto:dhiltrip@gmail.com", icon: Mail },
  { label: "Location", value: "Yogyakarta, Indonesia", icon: MapPin },
  { label: "Instagram", value: "@dhiltrip", href: "https://instagram.com/dhiltrip", icon: Camera },
];

type SendStatus = "idle" | "sending" | "both" | "whatsapp-only";

function CustomTripSheet({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<SendStatus>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("botcheck")) return;

    const fields = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    const text = [
      "Hello Dhil Trip, I would like a custom trip.",
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      `Phone: ${fields.phone}`,
      "",
      fields.message,
    ].join("\n");

    // Open the tab now, while the tap still counts as the user's action, so it is not blocked as a popup.
    const whatsappTab = window.open("", "_blank");
    setStatus("sending");
    const emailed = await sendEmailCopy(`Custom trip request from ${fields.name}`, fields);
    if (whatsappTab) {
      whatsappTab.opener = null;
      whatsappTab.location.href = whatsappLink(text);
    } else {
      window.location.href = whatsappLink(text);
    }
    setStatus(emailed ? "both" : "whatsapp-only");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label="Plan a custom trip">
      <div className="flex max-h-[92dvh] w-full max-w-[480px] animate-rise-in flex-col overflow-hidden rounded-t-3xl bg-[#F3F4DC] text-[#12372A] lg:max-w-xl lg:rounded-3xl">
        <div className="flex items-start justify-between gap-3 bg-[#0D2A1F] px-5 pb-4 pt-5 text-white">
          <div>
            <h2 className="font-fredoka text-2xl font-semibold leading-tight">Let&apos;s Plan Your Journey</h2>
            <p className="mt-1 text-sm text-white/80">Reach out to us to create a custom experience.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-8 pt-4">
          <ul className="grid grid-cols-1 gap-3">
            {contacts.map(({ label, value, href, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D2A1F] text-[#ADBC9F]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-[#436850]">{label}</span>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" translate="no" className="notranslate block break-words font-semibold hover:underline">
                      {value}
                    </a>
                  ) : (
                    <span translate="no" className="notranslate block font-semibold">{value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {status === "both" || status === "whatsapp-only" ? (
            <div role="status" className="animate-rise-in rounded-3xl bg-white p-6 text-center shadow">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#03603F]" />
              <h3 className="title-card mt-2 text-[#03603F]">Message sent!</h3>
              <p className="mt-1 text-pretty text-sm">
                {status === "both"
                  ? "We received your message by email, and WhatsApp is open so you can chat with us directly."
                  : "WhatsApp is open with your message. Press send there so it reaches us."}
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 min-h-12 w-full rounded-2xl border border-[#12372A]/30 font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
          <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-5 shadow">
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <label className="block text-sm font-semibold">
              Full Name
              <input name="name" required autoComplete="name" className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Email
              <input name="email" type="email" required autoComplete="email" className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Phone Number
              <input name="phone" type="tel" required autoComplete="tel" className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Message
              <textarea name="message" required rows={4} placeholder="Tell us about your group, dates, or specific needs..." className={`${field} resize-none`} />
            </label>
            <button
              disabled={status === "sending"}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70"
            >
              {status === "sending" ? (
                <>
                  Sending <Loader2 className="h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  Send Message <Send className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-[#436850]">
              {emailCopyEnabled
                ? "We receive your message by email, and WhatsApp opens so you can chat with us."
                : "Your message opens in WhatsApp, ready to send."}
            </p>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function HomeExtras() {
  const [customOpen, setCustomOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const memories = useMemories();
  const reviews = useReviews();
  const articles = useArticles();
  const average = averageRating(reviews);
  const shownReviews = allReviews ? reviews : reviews.slice(0, 6);

  return (
    <div className="mt-10 space-y-10 px-5 lg:mt-14 lg:space-y-14">
      <section className="rounded-3xl bg-gradient-to-b from-[#C2A44E] to-[#7E6322] p-5 text-center text-white shadow">
        <h2 className="title-card">Interested in creating your own journey?</h2>
        <p className="mt-1 text-sm">Tell us your group and dates, and we&apos;ll build a custom trip for you.</p>
        <button
          onClick={() => setCustomOpen(true)}
          className="mt-4 min-h-12 w-full rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white"
        >
          Contact Us!
        </button>
      </section>

      <section aria-labelledby="jogja-heading">
        <h2 id="jogja-heading" className={heading}>Memories from Jogja</h2>
        <AutoScrollStrip
          key={memories.map((photo) => photo.id).join()}
          label="Photos from Jogja"
          items={memories.map((photo) => ({
            key: photo.id,
            node: (
              <figure className="relative aspect-[3/4] w-[min(62vw,280px)] overflow-hidden rounded-3xl bg-[#DDE5BE] shadow">
                <Image src={photo.src} alt={photo.caption || "A memory from Jogja"} fill sizes="280px" className="object-cover" style={focusStyle(photo.focus)} />
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-left text-xs font-semibold text-white">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ),
          }))}
        />
      </section>

      <section aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading" className={heading}>What Our Travelers Say</h2>
        {reviews.length > 0 && (
          <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold shadow-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span translate="no" className="notranslate">{average.toFixed(1)}</span>
            <span className="text-[#436850]">
              ·<span translate="no" className="notranslate mx-[0.25em]">{reviews.length}</span>reviews
            </span>
          </div>
        )}
        <div className="mt-4 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          {shownReviews.map((item) => (
            <figure key={item.id} className="flex flex-col rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-5 text-white shadow">
              <div className="flex items-center justify-between gap-2">
                <Stars value={item.rating} />
                <Quote className="h-6 w-6 shrink-0 opacity-60" />
              </div>
              <blockquote translate="no" className="notranslate mt-2 flex-1 text-pretty text-sm leading-relaxed">{item.text}</blockquote>
              <figcaption className="mt-3 text-sm">
                <span translate="no" className="notranslate font-fredoka text-base font-semibold">{item.name}</span>
                {item.label && <span className="block text-xs text-white/80">{item.label}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
        {reviews.length > shownReviews.length && (
          <button
            onClick={() => setAllReviews(true)}
            className="mx-auto mt-4 flex min-h-11 items-center rounded-full border border-[#12372A]/30 px-5 text-sm font-semibold"
          >
            Show all reviews
          </button>
        )}
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={heading}>Frequently Asked Questions</h2>
        <div className="mt-4 space-y-2.5 lg:mx-auto lg:max-w-3xl">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{faq.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-pretty text-sm leading-relaxed text-[#436850]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section aria-labelledby="articles-heading">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="articles-heading" className="title-section text-black">Latest Articles</h2>
              <p className="text-pretty text-sm text-[#436850]">Insights and tips for a greener trip in Jogja.</p>
            </div>
            {articles.length > 4 && (
              <Link href="/articles" className="shrink-0 text-sm font-semibold text-[#03603F] underline">
                See all
              </Link>
            )}
          </div>
          <div className="mt-2 rounded-3xl bg-white px-4 shadow-sm lg:px-6">
            <ArticleList articles={articles.slice(0, 4)} />
          </div>
        </section>
      )}

      {customOpen && <CustomTripSheet onClose={() => setCustomOpen(false)} />}
    </div>
  );
}
