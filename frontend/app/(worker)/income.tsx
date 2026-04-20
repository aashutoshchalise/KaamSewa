import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";
import { api } from "../../src/api/axios";
import type { Booking } from "../../src/types";

type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

type WithdrawalRequest = {
  id: number;
  worker: number;
  amount: string;
  status: WithdrawalStatus;
  created_at: string;
};

type WorkerWalletSummary = {
  total_earned: string;
  available_balance: string;
  pending_withdrawals_total: string;
  pending_withdrawals_count: number;
  khalti_earnings: string;
  cash_earnings: string;
};

const COMMISSION_RATE = 0.2;

function getJobAmount(job: Booking) {
  return Number(job.final_price || job.service_price || 0);
}

async function fetchWorkerWalletSummary(): Promise<WorkerWalletSummary> {
  const { data } = await api.get<WorkerWalletSummary>(
    "/api/payments/wallet/summary/"
  );
  return data;
}

async function fetchMyWithdrawals(): Promise<WithdrawalRequest[]> {
  const { data } = await api.get<WithdrawalRequest[]>(
    "/api/payments/withdraw/my/"
  );
  return data;
}

async function submitWithdrawal(amount: number): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>(
    "/api/payments/withdraw/",
    { amount }
  );
  return data;
}

export default function WorkerIncome() {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["worker-income-jobs"],
    queryFn: getMyBookings,
  });

  const { data: wallet, isLoading: walletLoading } = useQuery<WorkerWalletSummary>({
    queryKey: ["worker-wallet-summary"],
    queryFn: fetchWorkerWalletSummary,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<
    WithdrawalRequest[]
  >({
    queryKey: ["worker-withdrawals"],
    queryFn: fetchMyWithdrawals,
  });

  const withdrawMutation = useMutation({
    mutationFn: submitWithdrawal,
    onSuccess: (res: { detail: string }) => {
      Alert.alert("Success", res.detail);
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["worker-wallet-summary"] });
      queryClient.invalidateQueries({ queryKey: ["worker-withdrawals"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Withdrawal Error",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const completedJobs = useMemo(
    () => bookings?.filter((job) => job.status === "COMPLETED") ?? [],
    [bookings]
  );

  const averagePerJob =
    completedJobs.length > 0
      ? Math.round(Number(wallet?.total_earned || 0) / completedJobs.length)
      : 0;

  const isLoading = bookingsLoading || walletLoading || withdrawalsLoading;

  function handleWithdraw() {
    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Enter a valid withdrawal amount");
      return;
    }

    if (amount > Number(wallet?.available_balance || 0)) {
      Alert.alert("Withdrawal Error", "Amount exceeds available Khalti balance.");
      return;
    }

    withdrawMutation.mutate(amount);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  return (
    <FlatList
      data={completedJobs}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      style={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Ionicons name="wallet-outline" size={24} color="#111111" />
              </View>
            </View>

            <Text style={styles.heroTitle}>Income & Wallet</Text>
            <Text style={styles.heroSubtitle}>
              Track your Khalti earnings, cash earnings, and withdrawals
            </Text>

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryLabel}>Available Balance</Text>
              <Text style={styles.summaryAmount}>
                Rs. {wallet?.available_balance ?? "0.00"}
              </Text>
              <Text style={styles.summaryHint}>
                Only Khalti earnings can be withdrawn
              </Text>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatNumber}>
                  Rs. {wallet?.total_earned ?? "0.00"}
                </Text>
                <Text style={styles.heroStatLabel}>Total Earned</Text>
              </View>

              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatNumber}>
                  {wallet?.pending_withdrawals_count ?? 0}
                </Text>
                <Text style={styles.heroStatLabel}>Pending Requests</Text>
              </View>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Khalti Earnings</Text>
              <Text style={styles.breakdownValue}>
                Rs. {wallet?.khalti_earnings ?? "0.00"}
              </Text>
              <Text style={styles.breakdownSub}>Withdrawable</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Cash In Hand</Text>
              <Text style={styles.breakdownValue}>
                Rs. {wallet?.cash_earnings ?? "0.00"}
              </Text>
              <Text style={styles.breakdownSub}>Display only</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Completed Jobs</Text>
              <Text style={styles.breakdownValue}>{completedJobs.length}</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Avg. Per Job</Text>
              <Text style={styles.breakdownValue}>Rs. {averagePerJob}</Text>
            </View>
          </View>

          <View style={styles.withdrawCard}>
            <Text style={styles.withdrawTitle}>Request Withdrawal</Text>
            <Text style={styles.withdrawSubtitle}>
              You can withdraw only from your available Khalti balance
            </Text>

            <TextInput
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              <Ionicons name="arrow-up-outline" size={18} color="#111111" />
              <Text style={styles.withdrawButtonText}>
                {withdrawMutation.isPending ? "Requesting..." : "Request Withdrawal"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={18} color="#B45309" />
            <Text style={styles.noticeText}>
              Khalti payments are added to your available balance after commission
              deduction. Cash in hand payments are shown separately and are not
              withdrawable from the wallet.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
            <Text style={styles.sectionCount}>
              {withdrawals?.length ?? 0} request(s)
            </Text>
          </View>

          {!withdrawals?.length ? (
            <View style={styles.emptySmallCard}>
              <Text style={styles.emptySmallText}>No withdrawal requests yet.</Text>
            </View>
          ) : (
            <View style={styles.withdrawalsBlock}>
              {withdrawals.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.withdrawRow}>
                  <View>
                    <Text style={styles.withdrawRowAmount}>Rs. {item.amount}</Text>
                    <Text style={styles.withdrawRowDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.withdrawStatusBadge}>
                    <Text style={styles.withdrawStatusText}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Jobs</Text>
            <Text style={styles.sectionCount}>{completedJobs.length} jobs</Text>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Ionicons name="cash-outline" size={42} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No completed jobs yet</Text>
          <Text style={styles.emptyText}>
            Your completed jobs and earnings will appear here.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const jobAmount = getJobAmount(item);
        const commission = Math.round(jobAmount * COMMISSION_RATE);
        const workerGets = Math.round(jobAmount - commission);

        return (
          <View style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={styles.jobIconWrap}>
                <Ionicons name="briefcase-outline" size={18} color="#111111" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.service_name}</Text>
                <Text style={styles.jobSub}>Job #{item.id}</Text>
              </View>

              <Text style={styles.jobAmount}>Rs. {workerGets}</Text>
            </View>

            <View style={styles.payoutBox}>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Job Total</Text>
                <Text style={styles.payoutValue}>Rs. {jobAmount}</Text>
              </View>

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Admin Commission (20%)</Text>
                <Text style={styles.payoutValue}>Rs. {commission}</Text>
              </View>

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>You Get</Text>
                <Text style={styles.payoutStrong}>Rs. {workerGets}</Text>
              </View>
            </View>

            <View style={styles.jobInfoBlock}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {item.scheduled_at
                    ? new Date(item.scheduled_at).toLocaleString()
                    : "Not scheduled"}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    marginTop: 6,
    color: "#D1D5DB",
    fontSize: 14,
  },
  summaryPanel: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  summaryAmount: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  summaryHint: {
    marginTop: 6,
    color: "#9CA3AF",
    fontSize: 12,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  heroStatBox: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 14,
  },
  heroStatNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  breakdownValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "bold",
    color: "#111111",
  },
  breakdownSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
  withdrawCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  withdrawTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },
  withdrawSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  input: {
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
  },
  withdrawButton: {
    marginTop: 14,
    backgroundColor: "#F4B400",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  withdrawButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
  noticeCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  noticeText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },
  sectionCount: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "bold",
    color: "#111111",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  emptySmallCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  emptySmallText: {
    color: "#6B7280",
    fontSize: 14,
  },
  withdrawalsBlock: {
    marginBottom: 18,
    gap: 10,
  },
  withdrawRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  withdrawRowAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },
  withdrawRowDate: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  withdrawStatusBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  withdrawStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  jobTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  jobIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF7D6",
    justifyContent: "center",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },
  jobSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  jobAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },
  payoutBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  payoutLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  payoutValue: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "600",
  },
  payoutStrong: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "bold",
  },
  jobInfoBlock: {
    marginTop: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});