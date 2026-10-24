export type Role = 'rider' | 'driver' | 'both';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  cnic_verified: boolean;
  licence_verified: boolean;
  rating: number;
  women_only?: boolean;
}

export interface Ride {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_rating?: number;
  driver_trips?: number;
  // Set for Supabase rides: true = admin-verified, false = data submitted,
  // verification still pending. Undefined = unknown (e.g. legacy rows).
  driver_verified?: boolean;
  women_only?: boolean;
  vehicle?: string;
  from_area: string;
  to_area: string;
  ride_date: string;
  ride_time: string;
  seats_total: number;
  seats_left: number;
  price_per_seat: number;
  status: 'active' | 'full' | 'completed' | 'cancelled';
}

export interface Booking {
  id: string;
  ride_id: string;
  rider_id: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

// Demo rides — sirf tab dikhte hain jab Supabase configure nahi hai.
export const DEMO_RIDES: Ride[] = [
  { id: 'demo-1', driver_id: 'd1', driver_name: 'Ahmed Raza', driver_rating: 4.8, driver_trips: 214, vehicle: 'Toyota Corolla • 2021 • White', from_area: 'Johar Town', to_area: 'Gulberg III', ride_date: '2026-10-25', ride_time: '08:00', seats_total: 3, seats_left: 2, price_per_seat: 250, status: 'active' },
  { id: 'demo-2', driver_id: 'd2', driver_name: 'Fatima Khan', driver_rating: 5.0, driver_trips: 168, women_only: true, vehicle: 'Honda City • 2019 • Silver', from_area: 'DHA Phase 5', to_area: 'Johar Town', ride_date: '2026-10-25', ride_time: '09:00', seats_total: 4, seats_left: 3, price_per_seat: 450, status: 'active' },
  { id: 'demo-3', driver_id: 'd3', driver_name: 'Usman Ali', driver_rating: 4.7, driver_trips: 97, vehicle: 'Honda Civic • 2020 • Black', from_area: 'Wapda Town', to_area: 'Model Town', ride_date: '2026-10-25', ride_time: '09:30', seats_total: 2, seats_left: 1, price_per_seat: 280, status: 'active' },
  { id: 'demo-4', driver_id: 'd4', driver_name: 'Sara Khan', driver_rating: 4.9, driver_trips: 142, women_only: true, vehicle: 'Suzuki Alto • 2019 • Silver', from_area: 'Johar Town', to_area: 'Gulberg III', ride_date: '2026-10-25', ride_time: '10:00', seats_total: 3, seats_left: 3, price_per_seat: 240, status: 'active' },
];
