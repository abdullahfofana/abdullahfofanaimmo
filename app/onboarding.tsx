import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',
    eyebrow: 'DÉCOUVRIR',
    title: 'Trouvez votre\nbien idéal.',
    description:
      'Des milliers de propriétés en Côte d\'Ivoire. Maisons, appartements, terrains et commerces.',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85',
    eyebrow: 'EXPLORER',
    title: 'Votre quartier\nà portée de main.',
    description:
      'Cocody, Plateau, Marcory, Yopougon — naviguez par quartier et trouvez la propriété parfaite.',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=900&q=85',
    eyebrow: 'CONTACTER',
    title: 'Agents locaux\nen un clic.',
    description:
      'Contactez directement les agents immobiliers de confiance. Simple, rapide, sécurisé.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/auth');
    }
  };

  const renderItem = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, -20],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        {/* Full-bleed photo */}
        <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(6,12,8,0.72)', 'rgba(6,12,8,0.95)']}
          locations={[0.30, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom content */}
        <Animated.View
          style={[
            styles.slideContent,
            { paddingBottom: insets.bottom + 160 },
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
          ]}
        >
          <Text style={styles.slideEyebrow}>{item.eyebrow}</Text>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDesc}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip button — top right */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.replace('/auth')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Full-bleed slides */}
      <Animated.FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Bottom bar — pagination + CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* Dot pagination */}
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 24, 6],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity style={styles.ctaBtn} onPress={scrollTo} activeOpacity={0.88}>
          <Text style={styles.ctaBtnText}>
            {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          <ArrowRight size={18} color={Colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0C',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-end',
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.1,
  },

  // Slide
  slide: {
    width,
    height,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    gap: 10,
  },
  slideEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentLight,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 42,
    letterSpacing: -1.0,
  },
  slideDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 23,
    fontWeight: '400',
    maxWidth: 340,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: 24,
    zIndex: 10,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.1,
  },
});
