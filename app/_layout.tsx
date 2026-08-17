import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PropertySubmissionProvider } from "@/providers/PropertySubmissionProvider";
import { IntegrationProvider } from "@/providers/IntegrationProvider";
import { FavoritesProvider } from "@/providers/FavoritesProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import AIChatbot from '../components/AIChatbot';
import SellerAIAssistant from '../components/SellerAIAssistant';
import { View, Platform } from "react-native";
import { trpc, getBaseUrl } from "@/lib/trpc";
import { httpLink } from "@trpc/client";
import superjson from "superjson";

SplashScreen.preventAutoHideAsync();

const figmaAnimationsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

  body, html, * {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .immoci-property-card {
    transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.38s cubic-bezier(0.16, 1, 0.3, 1) !important;
    cursor: pointer !important;
  }
  .immoci-property-card:hover {
    transform: translateY(-8px) scale(1.008) !important;
    box-shadow: 0 24px 44px -8px rgba(6, 78, 59, 0.18), 0 12px 20px -6px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(16, 185, 129, 0.5) !important;
  }
  .immoci-card-image {
    transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .immoci-property-card:hover .immoci-card-image {
    transform: scale(1.08) !important;
  }
  .immoci-card-title {
    transition: color 0.25s ease !important;
  }
  .immoci-property-card:hover .immoci-card-title {
    color: #059669 !important;
  }
  .immoci-hover-pill {
    opacity: 0 !important;
    transform: translateY(8px) scale(0.92) !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    pointer-events: none;
  }
  .immoci-property-card:hover .immoci-hover-pill {
    opacity: 1 !important;
    transform: translateY(0) scale(1) !important;
  }
  .immoci-favorite-btn {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, border-color 0.25s ease !important;
  }
  .immoci-favorite-btn:hover {
    transform: scale(1.22) !important;
    background-color: rgba(239, 68, 68, 0.25) !important;
    border-color: rgba(239, 68, 68, 0.6) !important;
  }
  @keyframes pulseGlowGreen {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  @keyframes pulseGlowBlue {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 7px rgba(37, 99, 235, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
  }
  .immoci-dot-sale {
    animation: pulseGlowGreen 2s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }
  .immoci-dot-rent {
    animation: pulseGlowBlue 2s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }
  @keyframes shimmerGlow {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .immoci-featured-shimmer {
    background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%) !important;
    background-size: 200% auto !important;
    animation: shimmerGlow 3s infinite linear !important;
  }
  .immoci-see-all-btn {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .immoci-see-all-btn:hover {
    transform: translateX(4px) !important;
    border-color: #059669 !important;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.15) !important;
  }
  @keyframes cardFadeInUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .immoci-card-animate {
    animation: cardFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
`;

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="help" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="ideas" options={{ title: "Product Ideas" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [trpcClient] = useState(() => {
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/trpc`;

    return trpc.createClient({
      links: [
        httpLink({
          url: apiUrl,
          transformer: superjson,
        }),
      ],
    });
  });

  useEffect(() => {
    SplashScreen.hideAsync();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'immoci-figma-animations-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = figmaAnimationsStyle;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <FavoritesProvider>
              <IntegrationProvider>
                <PropertySubmissionProvider>
                  <LanguageProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <View style={{ flex: 1, position: 'relative' }}>
                        <RootLayoutNav />
                        <AIChatbot />
                        <SellerAIAssistant />
                      </View>
                    </GestureHandlerRootView>
                  </LanguageProvider>
                </PropertySubmissionProvider>
              </IntegrationProvider>
            </FavoritesProvider>
          </ThemeProvider>
        </AuthProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
