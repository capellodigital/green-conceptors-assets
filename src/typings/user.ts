export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export enum Status {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type UserTypes = {
  name: string;
  email: string;
  username: string;
  password: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  role: string;
  status: string;
  memories: string[];
  purchases: string[];
  cart: string[];
};
