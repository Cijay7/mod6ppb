import "react-native-gesture-handler"; // WAJIB PALING ATAS
import React, { useState, useEffect, useCallback } from "react";
import { View, Image, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { MonitoringScreen } from "./src/screens/MonitoringScreen.js";
import { ControlScreen } from "./src/screens/ControlScreen.js";
import { LoginScreen } from "./src/screens/LoginScreen.js";
import { ProfileScreen } from "./src/screens/ProfileScreen.js";

import { assertConfig } from "./src/services/config.js";
import { supabase } from "./src/services/supabase.js";

// 1. Tahan Splash Screen Native
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: "IOTWatch",
        headerTitleAlign: "center",
        headerTintColor: "#1f2937",
        headerStyle: { backgroundColor: "#f8f9fb" },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarItemStyle: { borderRadius: 10 },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Monitoring") iconName = "analytics";
          else if (route.name === "Control") iconName = "options";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        assertConfig();
        
        // Ambil sesi
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        // Delay 3 detik (Simulasi Loading)
        await new Promise(resolve => setTimeout(resolve, 3000)); 
      } catch (e) {
        console.warn(e);
      } finally {
        // Tandai aplikasi siap -> Pindah ke Menu Utama
        setAppIsReady(true);
      }
    }

    prepare();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- PERBAIKAN DI SINI ---
  const onLayoutRootView = useCallback(async () => {
    // Kita TIDAK MENUNGGU appIsReady true.
    // Begitu komponen <View> ini dirender (artinya React sudah jalan),
    // kita langsung hilangkan Splash Screen Native agar user melihat Spinner kita.
    await SplashScreen.hideAsync();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "#f8f9fb" },
  };

  // 1. TAMPILAN LOADING (Spinner Berputar)
  if (!appIsReady) {
    return (
      // onLayout dipasang di sini. Begitu ini muncul, Splash Native hilang.
      <View style={styles.loadingContainer} onLayout={onLayoutRootView}>
        <Image 
          source={require("./assets/splash-icon.png")} 
          style={styles.loadingLogo} 
        />
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 10, color: "#666", fontWeight: '600' }}>
          Starting IOTWatch...
        </Text>
      </View>
    );
  }

  // 2. TAMPILAN UTAMA (Masuk Aplikasi)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={theme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <Stack.Screen name="MainTabs" component={MainTabs} />
            ) : (
              <Stack.Group>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="MainTabs" component={MainTabs} />
              </Stack.Group>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff", 
  },
  loadingLogo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
});