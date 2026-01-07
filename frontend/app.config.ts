import "dotenv/config";

export default {
  expo: {
    name: "KaamSewa",
    slug: "kaamsewa",
    extra: {
      API_BASE_URL: process.env.API_BASE_URL ?? "http://127.0.0.1:8001",
    },
  },
};