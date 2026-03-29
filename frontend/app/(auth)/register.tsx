import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account 🚀</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Phone"
        style={styles.input}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#F4B400",
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
  },
});