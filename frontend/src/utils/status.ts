export type BookingStatus =
  | "PENDING"
  | "CLAIMED"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

export function getStatusMeta(status: string) {
  const s = status?.toUpperCase?.() ?? "PENDING";

  switch (s) {
    case "PENDING":
      return {
        label: "Pending",
        textColor: "#8A6D00",
        bgColor: "#FFF4CC",
      };

    case "CLAIMED":
      return {
        label: "Claimed",
        textColor: "#7A3E00",
        bgColor: "#FFE0C2",
      };

    case "NEGOTIATING":
      return {
        label: "Negotiating",
        textColor: "#6A1B9A",
        bgColor: "#F3E5FF",
      };

    case "ACCEPTED":
      return {
        label: "Accepted",
        textColor: "#0D47A1",
        bgColor: "#DCEBFF",
      };

    case "IN_PROGRESS":
      return {
        label: "In Progress",
        textColor: "#1565C0",
        bgColor: "#D9EEFF",
      };

    case "COMPLETED":
      return {
        label: "Completed",
        textColor: "#1B5E20",
        bgColor: "#DDF5E3",
      };

    case "CANCELED":
      return {
        label: "Canceled",
        textColor: "#B71C1C",
        bgColor: "#FFE1E1",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        textColor: "#B71C1C",
        bgColor: "#FFE1E1",
      };

    default:
      return {
        label: status,
        textColor: "#444444",
        bgColor: "#EEEEEE",
      };
  }
}