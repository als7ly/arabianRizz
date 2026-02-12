/* eslint-disable no-unused-vars */

// ====== USER PARAMS
declare type CreateUserParams = {
  clerkId: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photo: string;
};

declare type UpdateUserParams = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  photo?: string;
  bio?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  relationshipGoal?: string;
};

// ====== GIRL PARAMS
declare type CreateGirlParams = {
  name: string;
  age?: number;
  vibe?: string;
  dialect?: string;
  language?: string;
  voiceId?: string;
  relationshipStatus?: string;
  rating?: number;
  socialMediaHandle?: string;
  userId: string;
  path: string;
};

declare type UpdateGirlParams = {
  _id: string;
  name?: string;
  age?: number;
  vibe?: string;
  dialect?: string;
  language?: string;
  voiceId?: string;
  relationshipStatus?: string;
  rating?: number;
  socialMediaHandle?: string;
  path: string;
};

declare type Girl = {
  _id: string;
  name: string;
  age?: number;
  vibe?: string;
  dialect?: string;
  language?: string;
  voiceId?: string;
  relationshipStatus?: string;
  rating?: number;
  socialMediaHandle?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

// ====== MESSAGE PARAMS
declare type CreateMessageParams = {
  girlId: string;
  role: "user" | "girl" | "wingman" | "system";
  content: string;
  embedding?: number[];
  path?: string;
};

declare type Message = {
    _id?: string;
    role: string;
    content: string;
    createdAt?: string;
};

// ====== TRANSACTION PARAMS
declare type CheckoutTransactionParams = {
  plan: string;
  credits: number;
  amount: number;
  buyerId: string;
};

declare type CreateTransactionParams = {
  stripeId: string;
  amount: number;
  credits: number;
  plan: string;
  buyerId: string;
  createdAt: Date;
};

// ====== URL QUERY PARAMS
declare type FormUrlQueryParams = {
  searchParams: string;
  key: string;
  value: string | number | null;
};

declare type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

declare type RemoveUrlQueryParams = {
  searchParams: string;
  keysToRemove: string[];
};

declare type SearchParamProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};
