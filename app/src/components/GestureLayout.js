import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

export function GestureLayout({ children, onSwipeLeft, onSwipeRight }) {
  // Ambil lebar layar HP
  const screenWidth = Dimensions.get('window').width;
  
  // Batas minimal geser (misal 15% dari lebar layar) agar dianggap swipe
  const swipeThreshold = screenWidth * 0.15; 

  const panGesture = Gesture.Pan()
    // PENTING: Agar navigasi (JS) bisa dipanggil dari thread UI Gesture
    .runOnJS(true) 
    // Konfigurasi agar tidak bentrok dengan ScrollView (Vertical)
    // Gesture hanya aktif jika gerakan horizontal lebih dominan dari vertikal
    .activeOffsetX([-20, 20]) 
    .failOffsetY([-20, 20]) 
    .onEnd((e) => {
      // e.translationX adalah jarak pergeseran jari (positif = ke kanan, negatif = ke kiri)
      
      // Jika geser ke KIRI (nilainya negatif) lebih jauh dari batas -> Swipe Left
      if (e.translationX < -swipeThreshold) {
        if (onSwipeLeft) onSwipeLeft();
      } 
      // Jika geser ke KANAN (nilainya positif) lebih jauh dari batas -> Swipe Right
      else if (e.translationX > swipeThreshold) {
        if (onSwipeRight) onSwipeRight();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});