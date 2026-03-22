import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
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

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
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

    updateMutation.mutate({
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="Enter username"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        placeholder="Enter phone number"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Enter email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, updateMutation.isPending && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={updateMutation.isPending}
      >
        <Text style={styles.buttonText}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
    paddingTop: 60,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111111",
  },

  label: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#FFC300",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
});