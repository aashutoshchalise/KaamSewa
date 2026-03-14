import { api } from "./axios";

export type CreateReviewPayload = {
  booking: number;
  rating: number;
  comment: string;
};

export async function createReview(payload: CreateReviewPayload) {
  const { booking, rating, comment } = payload;

  const { data } = await api.post(`/api/reviews/${booking}/`, {
    rating,
    comment,
  });

  return data;
}