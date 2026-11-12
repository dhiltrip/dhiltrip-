/** Where travelers pay, and where they confirm on WhatsApp. */
export const BANK = {
  bank: "Mandiri",
  accountNumber: "1370029094311",
  accountName: "DHILTRIP EXPLORATIONS GROUP",
} as const;

export const BOOKING_WHATSAPP = "6282234680849";
export const BOOKING_WHATSAPP_LABEL = "+62 822-3468-0849";

export const MAX_TRAVELERS = 30;

export type BookingRequestStatus = "new" | "confirmed" | "rejected";

/** A booking a traveler sends from the app; an admin checks the payment and confirms it with a booking code. */
export type BookingRequest = {
  id: string;
  uid: string;
  packageId: string;
  packageTitle: string;
  date: string;
  people: number;
  fullName: string;
  country: string;
  passport: string;
  email: string;
  whatsapp: string;
  meetingPoint: string;
  totalLabel: string;
  status: BookingRequestStatus;
  /** The booking code created when the admin confirms. */
  code: string | null;
  adminNote: string;
  createdAt: number;
};

/** Short reference shown to the traveler and in WhatsApp, e.g. REQ-7KQ2. */
export const requestRef = (id: string) => `REQ-${id.slice(0, 6).toUpperCase()}`;

/** Country names for the form, in English. */
export function countryNames(): string[] {
  try {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    const codes = "AF AL DZ AR AM AU AT AZ BH BD BY BE BJ BT BO BA BW BR BN BG KH CM CA CL CN CO CR HR CU CY CZ DK DO EC EG SV EE ET FJ FI FR GE DE GH GR GT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KR KW KG LA LV LB LT LU MO MG MY MV ML MT MX MD MN ME MA MZ MM NA NP NL NZ NI NG MK NO OM PK PS PA PG PY PE PH PL PT QA RO RU RW SA SN RS SG SK SI ZA ES LK SE CH TW TJ TZ TH TL TN TR TM UG UA AE GB US UY UZ VE VN YE ZM ZW".split(" ");
    return codes.map((code) => names.of(code) ?? code).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
