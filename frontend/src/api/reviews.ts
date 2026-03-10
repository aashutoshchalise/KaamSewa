import { api } from "./axios";

export type CreateReviewPayload = {
  booking: number;
  rating: number;
  comment: string;
};

export async function createReview(payload: CreateReviewPayload) {
  const { data } = await api.post("/api/reviews/", payload);
  return data;
}