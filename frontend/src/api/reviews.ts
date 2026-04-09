import { api } from "./axios";

export type CreateReviewPayload = {
  bookingId: number;
  rating: number;
  comment?: string;
};

export async function createReview(payload: CreateReviewPayload) {
  const res = await api.post(`/api/reviews/${payload.bookingId}/`, {
    rating: payload.rating,
    comment: payload.comment ?? "",
  });
  return res.data;
}