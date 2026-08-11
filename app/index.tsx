import { Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function Index() {
  const isWeb = Platform.OS === 'web';
  if (isWeb) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/splash" />;
}
