import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../services/supabase.js";
// 1. IMPORT GESTURE
import { GestureLayout } from "../components/GestureLayout.js";

export function ProfileScreen({ navigation }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { const { error } = await supabase.auth.signOut(); if (error) Alert.alert("Error", error.message); } },
    ]);
  };

  // 2. WRAPPER GESTURE (Swipe Kanan -> Ke Control)
  const goToControl = () => navigation.navigate("Control");

  // --- TAMPILAN GUEST ---
  if (!session) {
    return (
      <GestureLayout onSwipeRight={goToControl}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.guestCard}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle-outline" size={40} color="#9ca3af" />
            </View>
            <Text style={styles.name}>Guest User</Text>
            <Text style={styles.email}>You are not logged in.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginButtonText}>Log In Now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureLayout>
    );
  }

  // --- TAMPILAN USER ---
  return (
    <GestureLayout onSwipeRight={goToControl}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.card}>
          <View style={styles.headerProfile}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.label}>Logged in as</Text>
              <Text style={styles.email}>{session.user.email}</Text>
              <Text style={styles.uid}>UID: {session.user.id.slice(0, 8)}...</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Info", "Coming soon!")}>
              <Ionicons name="settings-outline" size={24} color="#4b5563" />
              <Text style={styles.menuText}>App Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Info", "v1.0.0")}>
              <Ionicons name="information-circle-outline" size={24} color="#4b5563" />
              <Text style={styles.menuText}>About App</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 20 },
  guestCard: { backgroundColor: "#fff", borderRadius: 16, padding: 30, alignItems: "center", elevation: 2 },
  loginButton: { marginTop: 20, backgroundColor: "#2563eb", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: "100%", alignItems: "center" },
  loginButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 },
  headerProfile: { flexDirection: "row", alignItems: "center", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingBottom: 20 },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", marginRight: 16 },
  userInfo: { flex: 1 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  name: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  email: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  uid: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#9ca3af", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  menuText: { flex: 1, fontSize: 16, color: "#4b5563", marginLeft: 12 },
  logoutButton: { flexDirection: "row", backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
});