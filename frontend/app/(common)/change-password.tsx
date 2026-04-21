import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
  } from "react-native";
  import { useState } from "react";
  import { useRouter } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import { api } from "../../src/api/axios";
  
  function validatePassword(password: string) {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
    return {
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSpecialChar,
      isValid: hasMinLength && hasUppercase && hasNumber && hasSpecialChar,
    };
  }
  
  function RuleItem({ ok, text }: { ok: boolean; text: string }) {
    return (
      <View style={styles.ruleRow}>
        <Ionicons
          name={ok ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={ok ? "#16A34A" : "#9CA3AF"}
        />
        <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{text}</Text>
      </View>
    );
  }
  
  export default function ChangePasswordScreen() {
    const router = useRouter();
  
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
  
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
  
    const [loading, setLoading] = useState(false);
  
    const checks = validatePassword(newPassword);
    const match =
      confirmPassword.length === 0 || newPassword === confirmPassword;
  
    async function handleChangePassword() {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Error", "All fields are required");
        return;
      }
  
      if (!checks.isValid) {
        Alert.alert(
          "Invalid Password",
          "Must be 8+ chars, 1 uppercase, 1 number, 1 special character"
        );
        return;
      }
  
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
  
      setLoading(true);
  
      try {
        await api.post("/api/auth/change-password/", {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });
  
        Alert.alert("Success", "Password updated", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.detail || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }
  
    const disabled =
      loading ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      !checks.isValid ||
      !match;
  
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.icon}>
                <Ionicons name="lock-closed" size={24} color="#111" />
              </View>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.sub}>Secure your account</Text>
            </View>
  
            {/* FORM */}
            <View style={styles.card}>
              {/* CURRENT */}
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  style={styles.input}
                  placeholder="Enter current password"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons
                    name={showCurrent ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
  
              {/* NEW */}
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  placeholder="Enter new password"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
  
              {/* RULES */}
              <View style={styles.rules}>
                <RuleItem ok={checks.hasMinLength} text="8+ characters" />
                <RuleItem ok={checks.hasUppercase} text="1 uppercase" />
                <RuleItem ok={checks.hasNumber} text="1 number" />
                <RuleItem ok={checks.hasSpecialChar} text="1 special char" />
              </View>
  
              {/* CONFIRM */}
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  placeholder="Confirm password"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
  
              {!match && (
                <Text style={{ color: "red", marginTop: 6 }}>
                  Passwords do not match
                </Text>
              )}
  
              {/* BUTTON */}
              <TouchableOpacity
                style={[styles.button, disabled && { opacity: 0.6 }]}
                disabled={disabled}
                onPress={handleChangePassword}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F8FAFC" },
  
    container: {
      padding: 20,
      paddingTop: 40,
    },
  
    header: {
      backgroundColor: "#111",
      padding: 24,
      borderRadius: 20,
      alignItems: "center",
      marginBottom: 20,
    },
  
    icon: {
      backgroundColor: "#F4B400",
      padding: 12,
      borderRadius: 12,
    },
  
    title: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 10,
    },
  
    sub: {
      color: "#ccc",
      marginTop: 4,
    },
  
    card: {
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 18,
    },
  
    label: {
      marginTop: 10,
      marginBottom: 6,
      fontWeight: "600",
    },
  
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
      paddingHorizontal: 12,
    },
  
    input: {
      flex: 1,
      height: 50,
    },
  
    rules: {
      marginTop: 10,
      marginBottom: 10,
    },
  
    ruleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
  
    ruleText: {
      fontSize: 13,
      color: "#666",
    },
  
    ruleTextOk: {
      color: "#16A34A",
    },
  
    button: {
      backgroundColor: "#F4B400",
      marginTop: 20,
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
    },
  
    buttonText: {
      fontWeight: "bold",
      fontSize: 16,
    },
  });