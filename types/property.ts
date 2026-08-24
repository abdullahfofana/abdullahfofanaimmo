export type PropertyType = 'apartment' | 'house' | 'villa' | 'land' | 'commercial';
export type PropertyStatus = 'sale' | 'rent';
export type UserRole = 'admin' | 'agent' | 'landlord' | 'renter' | 'support' | 'super_admin';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'rented';
export type PaymentMethod = 'orange_money' | 'mtn_money' | 'moov' | 'wave';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  location: {
    address: string;
    city: string;
    district: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  features: string[];
  agent: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  isFeatured: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface PropertySubmission {
  id: string;
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  location: {
    address: string;
    city: string;
    district: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  photos: string[];
  video?: string;
  document?: string;
  features: string[];
  agent: {
    name: string;
    phone: string;
  };
  payment: {
    method: PaymentMethod;
    transactionId: string;
    amount: number;
  };
  submissionStatus: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  is_test?: boolean;
}
