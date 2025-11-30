import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
import { supabase } from "../services/supabase.js";
// 1. IMPORT GESTURE
import { GestureLayout } from "../components/GestureLayout.js";

export function ControlScreen({ navigation }) {
  const [thresholdValue, setThresholdValue] = useState(30);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getThresholds();
      setHistory(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

  const latestThreshold = useMemo(() => history?.[0]?.value ?? null, [history]);

  const handleSubmit = useCallback(async () => {
    const valueNumber = Number(thresholdValue);
    if (Number.isNaN(valueNumber)) { setError("Numeric only."); return; }
    if (!session) { Alert.alert("Access Denied", "Must be logged in."); return; }

    setSubmitting(true);
    setError(null);
    try {
      await Api.createThreshold({ value: valueNumber, note }, session.access_token);
      setNote("");
      await fetchHistory();
      Alert.alert("Success", "Updated!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [thresholdValue, note, fetchHistory, session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);
  };

  // 2. DEFINE GESTURE HANDLERS (Kanan -> Monitor, Kiri -> Profile)
  const goToMonitor = () => navigation.navigate("Monitoring");
  const goToProfile = () => navigation.navigate("Profile");

  // --- TAMPILAN GUEST ---
  if (!session) {
    return (
      <GestureLayout onSwipeRight={goToMonitor} onSwipeLeft={goToProfile}>
        <SafeAreaView style={styles.guestContainer} edges={["top", "bottom"]}>
          <View style={styles.guestContent}>
            <Ionicons name="lock-closed-outline" size={64} color="#9ca3af" />
            <Text style={styles.guestTitle}>Access Restricted</Text>
            <Text style={styles.guestText}>Only logged-in users can modify threshold settings.</Text>
            <TouchableOpacity style={styles.loginLinkButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Go to Login Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Threshold History (Read Only)</Text>
          </View>
          <DataTable
              columns={[
                { key: "created_at", title: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
                { key: "value", title: "Value (°C)", render: (v) => `${Number(v).toFixed(2)}` },
              ]}
              data={history}
              keyExtractor={(item) => item.id}
          />
        </SafeAreaView>
      </GestureLayout>
    );
  }

  // --- TAMPILAN ADMIN ---
  return (
    <GestureLayout onSwipeRight={goToMonitor} onSwipeLeft={goToProfile}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Configure Threshold</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Ionicons name="log-out-outline" size={20} color="#c82333" />
                  <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {latestThreshold !== null && <Text style={styles.metaText}>Current: {Number(latestThreshold).toFixed(2)}°C</Text>}
              
              <Text style={styles.label}>Threshold (°C)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(thresholdValue)} onChangeText={setThresholdValue} />
              
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote} multiline numberOfLines={3} placeholder="Reason..." />
              
              {error && <Text style={styles.errorText}>{error}</Text>}
              
              <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Threshold</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Threshold History</Text>
              {loading && <ActivityIndicator />}
            </View>
            
            <DataTable
              columns={[
                { key: "created_at", title: "Saved At", render: (v) => v ? new Date(v).toLocaleString() : "--" },
                { key: "value", title: "Limit (°C)", render: (v) => typeof v === "number" ? `${Number(v).toFixed(2)}` : "--" },
                { key: "note", title: "Note", render: (v) => v || "-" },
              ]}
              data={history}
              keyExtractor={(item) => item.id}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8f9fb" },
  guestContainer: { flex: 1, padding: 16, backgroundColor: "#f8f9fb" },
  guestContent: { alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#fff", borderRadius: 12, marginBottom: 20, marginTop: 20 },
  guestTitle: { fontSize: 20, fontWeight: "bold", marginTop: 15, color: "#374151" },
  guestText: { textAlign: "center", marginTop: 8, color: "#6b7280", lineHeight: 20 },
  loginLinkButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#eff6ff", borderRadius: 8 },
  loginLinkText: { color: "#2563eb", fontWeight: "600" },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 16, elevation: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600" },
  logoutButton: { flexDirection: "row", alignItems: "center" },
  logoutText: { color: "#c82333", fontWeight: "600", marginLeft: 4 },
  label: { marginTop: 16, fontWeight: "600", color: "#444" },
  input: { borderWidth: 1, borderColor: "#d0d0d0", borderRadius: 8, padding: 12, marginTop: 8, fontSize: 16, backgroundColor: "#fff" },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  button: { marginTop: 20, backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  metaText: { color: "#666" },
  errorText: { marginTop: 12, color: "#c82333" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
});