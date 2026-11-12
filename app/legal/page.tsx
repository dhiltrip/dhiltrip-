import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal | Dhil Trip Explorations",
  description: "Privacy, terms, cookie, and cancellation information for Dhil Trip Explorations.",
};

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    body: [
      "We collect the details you give us when you contact us or join a trip, such as your name, email, phone number, booking code, and trip activity including points and visited destinations.",
      "When you book in the app we also collect your country, passport number, WhatsApp number, meeting point and a photo of your bank transfer. We use them only to check your payment and arrange your trip. Only our admins can see them, and you can ask us to delete them after your trip.",
      "During a trip your guide records the number and weight of the plastic bottles you collect, and when collected waste is delivered to our partner waste bank. We show these as your personal impact and as community totals without your name.",
      "We do not use your device location. Places on the map are ticked by you. If you scan a code, the camera is used on your device to read it. We do not store camera images.",
      "We use this information to run your trip, record your points, and respond to you. We do not sell your data. Trips and accounts for children require the consent of a parent or guardian.",
      "If you choose a language other than English, the page text is sent to Google Translate. You can ask us to access, correct, or delete your data at dhiltrip@gmail.com.",
    ],
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    body: [
      "Bookings are confirmed by our admin through WhatsApp or email. Package details and prices may change before a booking is confirmed.",
      "Points have no cash value, cannot be transferred, and may be cancelled if obtained dishonestly. Rewards are subject to availability.",
    ],
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    body: [
      "We use essential browser storage to keep you signed in and to remember your language. Choosing a language other than English loads Google Translate, which may set its own cookies.",
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation Policy",
    body: [
      "Please contact us at least 7 days before the trip for cancellation or rescheduling options.",
    ],
  },
];

export default function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm font-semibold text-secondary hover:underline">
        Back
      </Link>
      <h1 className="mt-4 text-4xl font-bold">Legal</h1>
      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-pretty leading-relaxed text-foreground/80">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
