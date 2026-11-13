/** What admins see per account in Admin → Travelers. */

export type TravelerBooking = {
  id: string;
  ref: string;
  packageTitle: string;
  date: string;
  people: number;
  status: string;
  code: string | null;
  createdAt: number;
};

export type TravelerRedemption = {
  id: string;
  rewardLabel: string;
  points: number;
  status: string;
  bookingCode: string | null;
  createdAt: number;
  handedAt: number;
};

export type Traveler = {
  uid: string;
  name: string;
  email: string;
  role: string;
  points: number;
  bottles: number;
  weightGrams: number;
  tripCode: string | null;
  tripPackageId: string | null;
  createdAt: number;
  bookings: TravelerBooking[];
  redemptions: TravelerRedemption[];
};
