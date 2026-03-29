import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { updateProfileApi } from "../../src/api/auth";
import { useAuth } from "../../src/store/AuthContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [khaltiNumber, setKhaltiNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setKhaltiNumber((user as any).khalti_number || "");
      setBankAccountNumber((user as any).bank_account_number || "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: async () => {
      await refreshMe();
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    },
    onError: (err: any) => {
      Alert.alert(
        "Update failed",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  function handleSave() {
    if (!username.trim()) {
      Alert.alert("Username is required");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Phone number is required");
      return;
    }

    updateMutation.mutate({
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim(),
      khalti_number: khaltiNumber.trim(),
      bank_account_number: bankAccountNumber.trim(),
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.iconBox}>
          <Ionicons name="person-circle-outline" size={26} color="#111" />
        </View>

        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.headerSub}>
          Update your personal and payout details
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color="#666" />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#888"
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Phone</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={18} color="#666" />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#666" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <Text style={styles.sectionTitlePayout}>Payout Details</Text>

        <Text style={styles.label}>Khalti Number</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="phone-portrait-outline" size={18} color="#666" />
          <TextInput
            value={khaltiNumber}
            onChangeText={setKhaltiNumber}
            placeholder="Enter Khalti mobile number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Bank Account Number</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="card-outline" size={18} color="#666" />
          <TextInput
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            placeholder="Enter bank account number"
            placeholderTextColor="#888"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            updateMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  headerSub: {
    marginTop: 5,
    color: "#CCCCCC",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 6,
  },

  sectionTitlePayout: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    marginTop: 22,
    marginBottom: 6,
  },

  label: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 13,
    color: "#666",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111",
  },

  button: {
    marginTop: 26,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111",
  },
});