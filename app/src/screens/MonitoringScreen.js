import { useCallback, useState, useEffect } from "react";
import {
  ScrollView, View, Text, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMqttSensor } from "../hooks/useMqttSensor.js";
import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
// 1. IMPORT GESTURE
import { GestureLayout } from "../components/GestureLayout.js";

export function MonitoringScreen({ navigation }) { // Terima prop navigation
  const { temperature, timestamp, connectionState, error: mqttError } = useMqttSensor();
  
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [clearing, setClearing] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchReadings = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await Api.getSensorReadings(targetPage, limit);
      setReadings(response.data ?? []);
      const total = response.total || 0;
      setTotalPages(Math.ceil(total / limit));
      setPage(targetPage);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReadings(1);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReadings(1);
    } finally {
      setRefreshing(false);
    }
  }, [fetchReadings]);

  const handleClearHistory = useCallback(async () => {
    Alert.alert(
      "Clear History",
      "Delete all data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              await Api.clearSensorReadings();
              await fetchReadings(1);
            } catch (err) {
              setApiError(err.message);
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  }, [fetchReadings]);

  return (
    // 2. BUNGKUS DENGAN GESTURE LAYOUT (Swipe Left -> Ke Control)
    <GestureLayout onSwipeLeft={() => navigation.navigate("Control")}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Realtime Temperature</Text>
            <View style={styles.valueRow}>
              <Text style={styles.temperatureText}>
                {typeof temperature === "number" ? `${temperature.toFixed(2)}°C` : "--"}
              </Text>
            </View>
            <Text style={styles.metaText}>MQTT status: {connectionState}</Text>
            {timestamp && <Text style={styles.metaText}>Last update: {new Date(timestamp).toLocaleString()}</Text>}
            {mqttError && <Text style={styles.errorText}>MQTT error: {mqttError}</Text>}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Triggered Readings History</Text>
            <View style={styles.headerActions}>
              {loading && <ActivityIndicator />}
              {clearing ? <ActivityIndicator style={{ marginLeft: 8 }} /> : (
                <TouchableOpacity onPress={handleClearHistory} disabled={loading || refreshing} style={{ marginLeft: 8 }}>
                  <Ionicons name="trash-outline" size={24} color="#c82333" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {apiError && <Text style={styles.errorText}>Failed to load history: {apiError}</Text>}
          
          <DataTable
            columns={[
              { key: "recorded_at", title: "Timestamp", render: (v) => v ? new Date(v).toLocaleString() : "--" },
              { key: "temperature", title: "Temp (°C)", render: (v) => typeof v === "number" ? `${Number(v).toFixed(2)}` : "--" },
              { key: "threshold_value", title: "Limit (°C)", render: (v) => typeof v === "number" ? `${Number(v).toFixed(2)}` : "--" },
            ]}
            data={readings}
            keyExtractor={(item) => item.id}
          />

          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              disabled={page === 1 || loading}
              onPress={() => fetchReadings(page - 1)}
            >
              <Ionicons name="chevron-back" size={20} color={page === 1 ? "#ccc" : "#fff"} />
              <Text style={[styles.pageButtonText, page === 1 && styles.textDisabled]}>Prev</Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>Page {page} of {totalPages || 1}</Text>

            <TouchableOpacity
              style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
              disabled={page >= totalPages || loading}
              onPress={() => fetchReadings(page + 1)}
            >
              <Text style={[styles.pageButtonText, page >= totalPages && styles.textDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? "#ccc" : "#fff"} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 16 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 16, elevation: 2 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  valueRow: { flexDirection: "row", alignItems: "flex-end" },
  temperatureText: { fontSize: 48, fontWeight: "700", color: "#ff7a59" },
  metaText: { marginTop: 8, color: "#555" },
  errorText: { marginTop: 8, color: "#c82333" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  paginationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 40, paddingHorizontal: 10 },
  pageButton: { flexDirection: "row", backgroundColor: "#2563eb", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: "center" },
  pageButtonDisabled: { backgroundColor: "#e5e7eb" },
  pageButtonText: { color: "#fff", fontWeight: "600", marginHorizontal: 4 },
  textDisabled: { color: "#9ca3af" },
  pageInfo: { color: "#4b5563", fontWeight: "600" },
});