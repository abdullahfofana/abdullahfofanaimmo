import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Plus, Video, FileText, Upload, MapPin, ChevronDown, Navigation, Sparkles, Lock, CheckCircle2, LogIn, ArrowRight } from 'lucide-react-native';
import SubmissionSuccessPopup from '@/components/SubmissionSuccessPopup';
import AnimatedSubmitButton from '@/components/AnimatedSubmitButton';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PropertyType, PropertyStatus, PaymentMethod } from '@/types/property';
import { ivoryCoastLocations } from '@/constants/ivoryCoastLocations';
import { trpc } from '@/lib/trpc';

interface FormData {
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  address: string;
  city: string;
  district: string;
  features: string[];
  agentName: string;
  agentPhone: string;
  photos: string[];
  video?: string;
  document?: string;
  paymentMethod?: PaymentMethod;
  transactionId: string;
}

export default function AddPropertyScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const { addSubmission } = usePropertySubmissions();
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPropertyId, setSuccessPropertyId] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'apartment',
    status: 'sale',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    district: '',
    features: [],
    agentName: '',
    agentPhone: '',
    photos: [],
    video: undefined,
    document: undefined,
    paymentMethod: undefined,
    transactionId: '',
  });

  const generateDescMutation = trpc.ai.generateDescription.useMutation();
  const estimatePriceMutation = trpc.ai.estimatePrice.useMutation();
  const [estimatedPriceRange, setEstimatedPriceRange] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    if (!formData.type || !formData.city) {
      if (Platform.OS === 'web') alert("Please select property type and location first.");
      else Alert.alert("Missing Info", "Please select property type and location first.");
      return;
    }

    try {
      const result = await generateDescMutation.mutateAsync({
        details: {
          type: formData.type,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
          features: formData.features,
          location: {
            city: formData.city,
            district: formData.district
          }
        }
      });
      if (result?.description) {
        updateField('description', result.description);
        return;
      }
    } catch (e) {
      console.log("Using local AI description generator");
    }

    const typeLabel = formData.type === 'villa' ? 'Magnifique Villa de standing' : formData.type === 'apartment' ? 'Superbe Appartement moderne' : formData.type === 'land' ? 'Terrain viabilisé avec titre' : 'Propriété d’exception';
    const locLabel = formData.district ? `${formData.district}, ${formData.city}` : formData.city;
    const desc = `${typeLabel} idéalement situé(e) à ${locLabel}. Offrant ${formData.bedrooms || '3'} chambres lumineuses, ${formData.bathrooms || '2'} salles d'eau, et un cadre de vie sécurisé et recherché. Titre de propriété en règle (ACD / Certificat de propriété). Visite possible sur rendez-vous.`;
    updateField('description', desc);
  };

  const handleEstimatePrice = async () => {
    if (!formData.type || !formData.city || !formData.area) return;

    try {
      const result = await estimatePriceMutation.mutateAsync({
        details: {
          type: formData.type,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
          area: parseFloat(formData.area),
          location: { city: formData.city, district: formData.district }
        }
      });
      if (result?.estimation?.min && result?.estimation?.max) {
        const min = (result.estimation.min / 1000000).toFixed(1) + 'M';
        const max = (result.estimation.max / 1000000).toFixed(1) + 'M';
        setEstimatedPriceRange(`${min} - ${max} FCFA`);
        return;
      }
    } catch (e) {
      console.log("Using local AI price estimator fallback");
    }

    const areaNum = parseFloat(formData.area) || 120;
    const basePerM2 = formData.type === 'villa' ? 650000 : formData.type === 'apartment' ? 500000 : 250000;
    const estMin = ((areaNum * basePerM2 * 0.85) / 1000000).toFixed(1);
    const estMax = ((areaNum * basePerM2 * 1.15) / 1000000).toFixed(1);
    setEstimatedPriceRange(`${estMin}M - ${estMax}M FCFA`);
  };

  const propertyTypes: PropertyType[] = ['apartment', 'house', 'villa', 'land', 'commercial'];
  const statusTypes: PropertyStatus[] = ['sale', 'rent'];

  const updateField = (field: keyof FormData, value: string | PropertyType | PropertyStatus | PaymentMethod | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSelectLocation = (city: string, district?: string) => {
    setFormData(prev => ({
      ...prev,
      city,
      district: district || '',
    }));
    setShowLocationPicker(false);
  };

  const handleUseMyLocation = async () => {
    setIsFetchingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          alert(t('location_permission_denied') || 'Location permission denied. Please enable GPS.');
        } else {
          Alert.alert(
            t('location_permission_denied') || 'Permission Denied',
            t('location_permission_message') || 'Please enable location services in your device settings to use this feature.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocoded = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const result = geocoded[0];

        const street = result.street || result.streetNumber || result.name || '';
        const district = result.subregion || result.district || result.city || '';
        const city = result.city || result.region || '';

        setFormData(prev => ({
          ...prev,
          address: street,
          district: district,
          city: city,
        }));

        if (Platform.OS === 'web') {
          alert(t('location_success') || 'Location detected successfully!');
        } else {
          Alert.alert(
            t('location_success') || 'Success',
            t('location_success_message') || 'Your location has been detected and filled in.',
            [{ text: 'OK' }]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          alert(t('location_geocode_failed') || 'Unable to detect location.');
        } else {
          Alert.alert(
            t('location_geocode_failed') || 'Geocoding Failed',
            t('location_geocode_failed_message') || 'Unable to determine your address. Please enter it manually.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('[Location] Error:', error);
      if (Platform.OS === 'web') {
        alert(t('location_error') || 'Unable to detect location.');
      } else {
        Alert.alert(
          t('location_error') || 'Error',
          t('location_error_message') || 'Failed to get your location. Please try again or enter manually.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const pickImage = async () => {
    const remaining = 3 - formData.photos.length;
    if (remaining <= 0) {
      if (Platform.OS === 'web') {
        alert('Maximum 3 photos allowed');
      } else {
        Alert.alert('Maximum 3 photos allowed');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.slice(0, remaining).map(a => a.uri);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newUris].slice(0, 3),
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        video: result.assets[0].uri,
      }));
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        document: result.assets[0].uri,
      }));
    }
  };

  const handleDevSubmit = async () => {
    setIsSubmitting(true);
    console.log("[Dev] ==== Starting DEV SKIP submission ====");
    console.log("[Dev] Bypassing payment & validation");
    console.log("[Dev] Status: DEV-MODE");

    try {
      console.log("[Dev] Creating test property payload...");
      const testPayload = {
        title: 'TEST — Sample 3BR Apartment (Dev)',
        description: 'Auto-created test property — ignore. For QA/dev verification of workflows.',
        price: 1000000,
        type: 'apartment' as PropertyType,
        status: 'rent' as PropertyStatus,
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        location: {
          address: 'Test Street, Dev Area',
          city: 'Abidjan',
          district: 'Cocody',
          coordinates: {
            latitude: 5.345,
            longitude: -4.027
          }
        },
        photos: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        video: 'https://www.w3schools.com/html/mov_bbb.mp4',
        document: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        features: ['WiFi', 'Parking', 'AC', 'Security', 'Pool'],
        agent: {
          name: 'Dev Test Agent',
          phone: '+225 0102030405',
        },
        payment: {
          method: 'orange_money' as PaymentMethod,
          transactionId: 'DEV-MODE-' + Date.now(),
          amount: 10000,
        },
        is_test: true,
      };

      console.log("[Dev] Payload ready:", JSON.stringify(testPayload, null, 2));
      console.log("[Dev] Calling addSubmission...");

      const submission = await addSubmission(testPayload);

      console.log("[Dev] ✅ SUCCESS! Property created:", submission.id);

      setSuccessPropertyId(submission.id);
      setShowSuccessModal(true);
      console.log("[Dev] ==== DEV SKIP submission complete ====");

    } catch (error) {
      console.error('[Dev] ❌ FAILED to submit dev property');
      console.error('[Dev] Error:', error);

      if (error instanceof Error) {
        console.error('[Dev] Error message:', error.message);
        console.error('[Dev] Error stack:', error.stack);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (Platform.OS === 'web') {
        alert(`❌ Dev submission failed\n\n${errorMessage}\n\nCheck console for details.`);
      } else {
        Alert.alert(
          '❌ Error',
          `Failed to submit dev property:\n\n${errorMessage}\n\nPlease check console logs.`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[Submit] ==== Starting property submission ====");
    console.log("[Submit] ===== ENVIRONMENT DEBUG =====");
    console.log("[Submit] EXPO_PUBLIC_RORK_API_BASE_URL:", process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'NOT SET');
    console.log("[Submit] Platform:", Platform.OS);
    console.log("[Submit] Is Web:", Platform.OS === 'web');
    console.log("[Submit] ===========================");
    console.log("[Submit] Validating form data...");

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.area ||
      !formData.address ||
      !formData.city ||
      !formData.district ||
      !formData.agentName ||
      !formData.agentPhone
    ) {
      console.warn("[Submit] ❌ Validation failed: Missing required fields");
      console.warn("[Submit] Form state:", {
        hasTitle: !!formData.title,
        hasDescription: !!formData.description,
        hasPrice: !!formData.price,
        hasArea: !!formData.area,
        hasAddress: !!formData.address,
        hasCity: !!formData.city,
        hasDistrict: !!formData.district,
        hasAgentName: !!formData.agentName,
        hasAgentPhone: !!formData.agentPhone,
      });

      if (Platform.OS === 'web') {
        alert(t('add_property_error'));
      } else {
        Alert.alert(t('add_property_error'), t('add_property_error'));
      }
      return;
    }

    if (formData.photos.length !== 3 || !formData.document) {
      console.warn("[Submit] ❌ Validation failed: Media requirements not met");
      console.warn("[Submit] Photos:", formData.photos.length, "/ 3");
      console.warn("[Submit] Document:", formData.document ? 'Yes' : 'No');

      if (Platform.OS === 'web') {
        alert(t('add_property_media_error'));
      } else {
        Alert.alert(t('add_property_media_error'), t('add_property_media_error'));
      }
      return;
    }

    if (!formData.paymentMethod || !formData.transactionId) {
      console.warn("[Submit] ❌ Validation failed: Payment information missing");
      console.warn("[Submit] Payment method:", formData.paymentMethod || 'Not selected');
      console.warn("[Submit] Transaction ID:", formData.transactionId || 'Not entered');

      if (Platform.OS === 'web') {
        alert(t('add_property_payment_required'));
      } else {
        Alert.alert(t('add_property_payment_required'), t('add_property_payment_required'));
      }
      return;
    }

    setIsSubmitting(true);
    console.log("[Submit] ✅ Validation passed");
    console.log("[Submit] Preparing payload...");

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        type: formData.type,
        status: formData.status,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: parseFloat(formData.area),
        location: {
          address: formData.address,
          city: formData.city,
          district: formData.district,
        },
        photos: formData.photos,
        video: formData.video,
        document: formData.document!,
        features: formData.features,
        agent: {
          name: formData.agentName,
          phone: formData.agentPhone,
        },
        payment: {
          method: formData.paymentMethod,
          transactionId: formData.transactionId,
          amount: 10000,
        },
      };

      console.log("[Submit] Payload prepared:", JSON.stringify(payload, null, 2));
      console.log("[Submit] Calling addSubmission API...");

      setUploadProgress('Uploading files...');
      const result = await addSubmission(payload);

      setUploadProgress('');
      console.log("[Submit] ✅ SUCCESS! Property submitted:", result.id);

      setSuccessPropertyId(result.id);
      setShowSuccessModal(true);

      console.log("[Submit] Resetting form...");
      setFormData({
        title: '',
        description: '',
        type: 'apartment',
        status: 'sale',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        address: '',
        city: '',
        district: '',
        features: [],
        agentName: '',
        agentPhone: '',
        photos: [],
        video: undefined,
        document: undefined,
        paymentMethod: undefined,
        transactionId: '',
      });

      console.log("[Submit] ==== Property submission complete ====");
    } catch (error) {
      console.error('[Submit] ❌ FAILED to submit property');
      console.error('[Submit] Error:', error);

      if (error instanceof Error) {
        console.error('[Submit] Error type:', error.constructor.name);
        console.error('[Submit] Error message:', error.message);
        console.error('[Submit] Error stack:', error.stack);
      }

      let errorMessage = 'Failed to submit property';
      let errorDetails = 'Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('UNAUTHORIZED') || error.message.includes('Missing auth token') || error.message.includes('Invalid or expired token')) {
          errorMessage = 'Session requise';
          errorDetails = 'Votre session a expiré. Veuillez vous reconnecter et réessayer.';
        } else if (error.message.includes('Cannot connect to backend') || error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          errorMessage = 'Connexion impossible';
          errorDetails = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        } else if (error.message.includes('Supabase') || error.message.includes('supabase') || error.message.includes('SUPABASE_NOT_CONFIGURED')) {
          errorMessage = 'Erreur de base de données';
          errorDetails = 'La connexion à la base de données a échoué. La soumission a été sauvegardée localement.';
        } else if (error.message.includes('storage/unauthorized') || error.message.includes('permission-denied')) {
          errorMessage = 'Permission Error';
          errorDetails = 'Unable to upload files. Please check Firebase Storage permissions and try again.';
        } else if (error.message.includes('storage/canceled')) {
          errorMessage = 'Upload Canceled';
          errorDetails = 'File upload was canceled. Please try again.';
        } else if (error.message.includes('storage/unknown')) {
          errorMessage = 'Upload Error';
          errorDetails = 'An unknown error occurred during file upload. Please check your connection and try again.';
        } else if (error.message.includes('Failed to convert URI to Blob')) {
          errorMessage = 'File Error';
          errorDetails = 'Unable to process selected files. Please try selecting different files.';
        } else if (error.message.includes('invalid-argument')) {
          errorMessage = 'Invalid Data';
          errorDetails = 'Some form data is invalid. Please check all fields and try again.';
        } else if (error.message.includes('Network request failed') || error.message.includes('fetch failed')) {
          errorMessage = 'Network Error';
          errorDetails = 'Please check your internet connection and try again.';
        } else if (error.message.includes('Firebase')) {
          errorMessage = 'Database Error';
          errorDetails = error.message;
        } else {
          errorDetails = error.message;
        }
      }

      console.error('[Submit] User-facing error:', errorMessage);
      console.error('[Submit] Error details:', errorDetails);

      if (Platform.OS === 'web') {
        alert(`${errorMessage}\n\n${errorDetails}`);
      } else {
        Alert.alert(
          errorMessage,
          errorDetails,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
      console.log("[Submit] Submit button re-enabled");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/(tabs)/home');
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setFormData({
      title: '',
      description: '',
      type: 'apartment',
      status: 'sale',
      price: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      address: '',
      city: '',
      district: '',
      features: [],
      agentName: '',
      agentPhone: '',
      photos: [],
      video: undefined,
      document: undefined,
      paymentMethod: undefined,
      transactionId: '',
    });
  };

  // ── Quick Fill helpers for testing ──────────────────────────────────────
  const fillBasicInfo = () => {
    setFormData(prev => ({
      ...prev,
      title: 'Villa Moderne à Cocody Riviera',
      description: 'Magnifique villa de 5 chambres avec piscine, jardin, et sécurité 24h/24. Idéale pour famille. Proche des commerces et écoles internationales.',
      type: 'villa' as any,
      status: 'sale' as any,
      price: '85000000',
    }));
  };

  const fillDetailsInfo = () => {
    setFormData(prev => ({
      ...prev,
      bedrooms: '5',
      bathrooms: '4',
      area: '350',
      features: ['Piscine', 'Jardin', 'Garage', 'Sécurité 24h', 'Climatisation'],
    }));
  };

  const fillLocationInfo = () => {
    setFormData(prev => ({
      ...prev,
      address: 'Rue des Cocotiers, Riviera 3',
      city: 'Abidjan',
      district: 'Cocody',
    }));
  };

  // ── Pro Auth Gate (Requires Login / Signup to Publish Property) ─────────
  if (!isAuthLoading && !user && !session && !bypassAuth) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#F8FAFC' }]}>
        <ScrollView
          contentContainerStyle={styles.authGateScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authGateCard}>
            {/* Top Pro Badge */}
            <View style={styles.authGateBadge}>
              <Sparkles size={13} color="#059669" />
              <Text style={styles.authGateBadgeText}>
                {t('auth_gate_badge') || 'ESPACE PRO & VENDEURS'}
              </Text>
            </View>

            {/* Glowing Icon Container */}
            <LinearGradient
              colors={['#064e3b', '#047857', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authGateIconWrapper}
            >
              <Lock size={32} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>

            {/* Heading & Subtitle */}
            <Text style={styles.authGateTitle}>
              {t('auth_gate_title') || 'Connectez-vous pour publier une annonce'}
            </Text>
            <Text style={styles.authGateSubtitle}>
              {t('auth_gate_subtitle') || 'Pour garantir la sécurité et l\'authenticité des offres sur ImmoCI, vous devez vous connecter ou créer un compte vérifié avant de soumettre un bien.'}
            </Text>

            {/* Key Benefits List */}
            <View style={styles.authBenefitsList}>
              <View style={styles.authBenefitItem}>
                <View style={styles.authBenefitIconCircle}>
                  <CheckCircle2 size={16} color="#059669" strokeWidth={2.5} />
                </View>
                <View style={styles.authBenefitTextCol}>
                  <Text style={styles.authBenefitTitle}>
                    {t('auth_benefit_1_title') || 'Visibilité N°1 en Côte d\'Ivoire'}
                  </Text>
                  <Text style={styles.authBenefitDesc}>
                    {t('auth_benefit_1_desc') || 'Diffusez vos biens auprès de milliers d\'acheteurs et locataires actifs à Abidjan et partout en Côte d\'Ivoire.'}
                  </Text>
                </View>
              </View>

              <View style={styles.authBenefitItem}>
                <View style={styles.authBenefitIconCircle}>
                  <CheckCircle2 size={16} color="#059669" strokeWidth={2.5} />
                </View>
                <View style={styles.authBenefitTextCol}>
                  <Text style={styles.authBenefitTitle}>
                    {t('auth_benefit_2_title') || 'Contacts directs & alertes instantanées'}
                  </Text>
                  <Text style={styles.authBenefitDesc}>
                    {t('auth_benefit_2_desc') || 'Recevez directement les demandes d\'acheteurs par WhatsApp, téléphone et email sans commission abusive.'}
                  </Text>
                </View>
              </View>

              <View style={styles.authBenefitItem}>
                <View style={styles.authBenefitIconCircle}>
                  <CheckCircle2 size={16} color="#059669" strokeWidth={2.5} />
                </View>
                <View style={styles.authBenefitTextCol}>
                  <Text style={styles.authBenefitTitle}>
                    {t('auth_benefit_3_title') || 'Tableau de bord & gestion autonome'}
                  </Text>
                  <Text style={styles.authBenefitDesc}>
                    {t('auth_benefit_3_desc') || 'Modifiez vos prix, photos et suivez les statistiques de vos annonces en temps réel.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.authGateActions}>
              <TouchableOpacity
                style={styles.authPrimaryBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.authPrimaryBtnGradient}
                >
                  <LogIn size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.authPrimaryBtnText}>
                    {t('auth_gate_login_btn') || 'Se connecter / Créer un compte'}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authSecondaryBtn}
                onPress={() => router.push('/(tabs)/home')}
                activeOpacity={0.75}
              >
                <Text style={styles.authSecondaryBtnText}>
                  {t('auth_gate_browse_btn') || 'Explorer les biens'}
                </Text>
              </TouchableOpacity>

              {/* DEV / TEST bypass button */}
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderStyle: 'dashed' as any,
                  borderColor: 'rgba(5,150,105,0.35)',
                  alignItems: 'center',
                }}
                onPress={() => setBypassAuth(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669' } as any}>
                  {language === 'fr' ? '🪧 Accéder au formulaire (test)' : '🪧 Skip to Form (Testing)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ===== SUCCESS POPUP ===== */}
      <SubmissionSuccessPopup
        visible={showSuccessModal}
        propertyId={successPropertyId}
        onGoHome={handleSuccessClose}
        onAddAnother={handleAddAnother}
      />

      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('add_property_title')}</Text>
          <Text style={styles.headerSubtitle}>{t('add_property_subtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.sectionTitle}>{t('add_property_basic_info')}</Text>
              <TouchableOpacity
                onPress={fillBasicInfo}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(5,150,105,0.10)', borderWidth: 1, borderColor: 'rgba(5,150,105,0.25)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', letterSpacing: 0.3 } as any}>⚡ {language === 'fr' ? 'Remplir' : 'Quick Fill'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_title_label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_title_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>{t('add_property_description_label')}</Text>
                <TouchableOpacity
                  onPress={handleGenerateDescription}
                  disabled={generateDescMutation.isPending}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  {generateDescMutation.isPending ? <ActivityIndicator size="small" color={Colors.primary} /> : <Sparkles size={14} color={Colors.primary} />}
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '600' }}>
                    {generateDescMutation.isPending ? (language === 'fr' ? 'Génération...' : 'Generating...') : (language === 'fr' ? 'Auto-Générer' : 'Auto-Generate')}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('add_property_description_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_type_label')}</Text>
              <View style={styles.chipContainer}>
                {propertyTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      formData.type === type && styles.chipActive,
                    ]}
                    onPress={() => updateField('type', type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.type === type && styles.chipTextActive,
                      ]}
                    >
                      {t(`search_${type}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_status_label')}</Text>
              <View style={styles.chipContainer}>
                {statusTypes.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      formData.status === status && styles.chipActive,
                    ]}
                    onPress={() => updateField('status', status)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.status === status && styles.chipTextActive,
                      ]}
                    >
                      {t(`search_${status}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>{t('add_property_price_label')}</Text>
                {estimatedPriceRange && (
                  <TouchableOpacity onPress={() => setEstimatedPriceRange(null)}>
                    <Text style={{ fontSize: 12, color: Colors.success, fontWeight: '600' }}>
                      Est: {estimatedPriceRange}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_price_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.price}
                onChangeText={(text) => updateField('price', text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.sectionTitle}>{t('add_property_details')}</Text>
              <TouchableOpacity
                onPress={fillDetailsInfo}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(5,150,105,0.10)', borderWidth: 1, borderColor: 'rgba(5,150,105,0.25)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', letterSpacing: 0.3 } as any}>⚡ {language === 'fr' ? 'Remplir' : 'Quick Fill'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('add_property_bedrooms_label')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  value={formData.bedrooms}
                  onChangeText={(text) => updateField('bedrooms', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('add_property_bathrooms_label')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  value={formData.bathrooms}
                  onChangeText={(text) => updateField('bathrooms', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_area_label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_area_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.area}
                onChangeText={(text) => {
                  updateField('area', text);
                  if (text.length > 1) setTimeout(handleEstimatePrice, 1000); // Debounce-ish check
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.sectionTitle}>{t('add_property_location')}</Text>
              <TouchableOpacity
                onPress={fillLocationInfo}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(5,150,105,0.10)', borderWidth: 1, borderColor: 'rgba(5,150,105,0.25)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', letterSpacing: 0.3 } as any}>⚡ {language === 'fr' ? 'Remplir' : 'Quick Fill'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('add_property_address_label')}</Text>
                <TouchableOpacity
                  style={styles.locationActionButton}
                  onPress={handleUseMyLocation}
                  disabled={isFetchingLocation}
                >
                  {isFetchingLocation ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Navigation size={16} color={Colors.primary} />
                      <Text style={styles.locationActionText}>
                        {t('use_my_location') || 'Use My Location'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_address_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_city_label')} & {t('add_property_district_label')}</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                style={[styles.input, styles.locationButton]}
              >
                <MapPin size={20} color={Colors.textLight} style={{ marginRight: Spacing.xs }} />
                <Text
                  style={[
                    styles.locationButtonText,
                    (formData.city || formData.district) && styles.locationButtonTextFilled,
                  ]}
                >
                  {formData.district && formData.city
                    ? `${formData.district}, ${formData.city}`
                    : formData.city
                      ? formData.city
                      : t('add_property_city_placeholder')}
                </Text>
                <ChevronDown size={20} color={Colors.textLight} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {showLocationPicker && (
              <View style={styles.locationPickerContainer}>
                <ScrollView
                  style={styles.locationPickerScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {ivoryCoastLocations.map((location) => (
                    <View key={location.city}>
                      <TouchableOpacity
                        style={styles.locationPickerItem}
                        onPress={() => handleSelectLocation(location.city)}
                      >
                        <MapPin size={16} color={Colors.primary} />
                        <Text style={styles.locationPickerCityText}>{location.city}</Text>
                      </TouchableOpacity>
                      {location.districts.map((district) => (
                        <TouchableOpacity
                          key={`${location.city}-${district}`}
                          style={[styles.locationPickerItem, styles.locationPickerDistrictItem]}
                          onPress={() => handleSelectLocation(location.city, district)}
                        >
                          <MapPin size={14} color={Colors.textLight} />
                          <View style={styles.locationPickerTextContainer}>
                            <Text style={styles.locationPickerDistrictText}>{district}</Text>
                            <Text style={styles.locationPickerSubtext}>{location.city}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closePickerButton}
                  onPress={() => setShowLocationPicker(false)}
                >
                  <Text style={styles.closePickerText}>{t('search_close')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('add_property_features_label')}</Text>

            <View style={styles.featureInputContainer}>
              <TextInput
                style={[styles.input, styles.featureInput]}
                placeholder={t('add_property_features_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={featureInput}
                onChangeText={setFeatureInput}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFeature}>
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {formData.features.length > 0 && (
              <View style={styles.featuresContainer}>
                {formData.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <Text style={styles.featureTagText}>{feature}</Text>
                    <TouchableOpacity onPress={() => removeFeature(index)}>
                      <X size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('add_property_media')}</Text>

            <View style={styles.inputGroup}>
              <View style={styles.photoLabelRow}>
                <Text style={styles.label}>{t('add_property_photos_label')}</Text>
                <Text style={styles.photoCountHint}>
                  {formData.photos.length}/3{' '}
                  {formData.photos.length === 0
                    ? '— select up to 3 at once'
                    : formData.photos.length < 3
                    ? `— ${3 - formData.photos.length} more allowed`
                    : '— complete ✓'}
                </Text>
              </View>
              <View style={styles.mediaGrid}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: photo }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removePhoto(index)}
                    >
                      <X size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.photos.length < 3 && (
                  <TouchableOpacity style={styles.addMediaButton} onPress={pickImage}>
                    <Upload size={24} color={Colors.primary} />
                    <Text style={styles.addMediaText}>
                      {formData.photos.length === 0
                        ? 'Add up to 3 photos'
                        : `Add ${3 - formData.photos.length} more`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_video_label')}</Text>
              {formData.video ? (
                <View style={styles.mediaItem}>
                  <View style={styles.videoPlaceholder}>
                    <Video size={32} color={Colors.primary} />
                    <Text style={styles.videoText}>Video added</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => updateField('video', undefined)}
                  >
                    <X size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addMediaButton} onPress={pickVideo}>
                  <Video size={24} color={Colors.primary} />
                  <Text style={styles.addMediaText}>{t('add_property_add_video')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_document_label')}</Text>
              {formData.document ? (
                <View style={styles.mediaItem}>
                  <View style={styles.videoPlaceholder}>
                    <FileText size={32} color={Colors.primary} />
                    <Text style={styles.videoText}>Document added</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => updateField('document', undefined)}
                  >
                    <X size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addMediaButton} onPress={pickDocument}>
                  <FileText size={24} color={Colors.primary} />
                  <Text style={styles.addMediaText}>{t('add_property_add_document')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('add_property_contact')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_name_label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_name_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.agentName}
                onChangeText={(text) => updateField('agentName', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('add_property_phone_label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('add_property_phone_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.agentPhone}
                onChangeText={(text) => updateField('agentPhone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.section, styles.paymentSection]}>
            <Text style={styles.sectionTitle}>{t('add_property_payment')}</Text>
            <Text style={styles.paymentDesc}>{t('add_property_payment_desc')}</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { marginBottom: Spacing.md }]}>{t('add_property_select_payment')}</Text>
              <View style={styles.paymentGrid}>
                {(['orange_money', 'mtn_money', 'moov', 'wave'] as PaymentMethod[]).map((method) => {
                  const logoMap: Record<PaymentMethod, string> = {
                    orange_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png',
                    mtn_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/440px-New-mtn-logo.jpg',
                    moov: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Moov_Africa.png/440px-Moov_Africa.png',
                    wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Wave_Mobile_Money_logo.png/440px-Wave_Mobile_Money_logo.png',
                  };
                  const nameMap: Record<PaymentMethod, string> = {
                    orange_money: 'ORANGE MONEY',
                    mtn_money: 'MTN MONEY',
                    moov: 'MOOV',
                    wave: 'WAVE',
                  };
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentOption,
                        formData.paymentMethod === method && styles.paymentOptionActive,
                        isSubmitting && styles.paymentOptionDisabled,
                      ]}
                      onPress={() => !isSubmitting && updateField('paymentMethod', method)}
                      disabled={isSubmitting}
                    >
                      <Image
                        source={{ uri: logoMap[method] }}
                        style={styles.paymentLogo}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.paymentOptionText,
                          formData.paymentMethod === method && styles.paymentOptionTextActive,
                        ]}
                      >
                        {nameMap[method]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: Spacing.md }]}>
              <Text style={styles.label}>{t('add_property_transaction_id')}</Text>
              <TextInput
                style={[styles.input, isSubmitting && styles.inputDisabled]}
                placeholder={t('add_property_transaction_id_placeholder')}
                placeholderTextColor={Colors.textLight}
                value={formData.transactionId}
                onChangeText={(text) => updateField('transactionId', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <View style={styles.footerButtonContainer}>
            {__DEV__ && (
              <TouchableOpacity
                style={[styles.skipButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleDevSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <Text style={styles.skipButtonText}>Skip (Dev)</Text>
                )}
              </TouchableOpacity>
            )}
            <AnimatedSubmitButton
              label={t('add_property_submit') || 'Submit Property'}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isSuccess={showSuccessModal}
              progressLabel={uploadProgress || undefined}
              colors={[Colors.primary, '#047857']}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  devButton: {
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  devButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 220, // Extra padding for the footer
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
  photoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  photoCountHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  locationActionText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  featureInputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  featureTagText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  paymentSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  paymentDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  paymentOption: {
    width: '47%',
    aspectRatio: 1.6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  paymentOptionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
    textAlign: 'center',
    fontSize: 12,
  },
  paymentOptionTextActive: {
    color: Colors.primary,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentLogo: {
    width: 60,
    height: 40,
    marginBottom: Spacing.xs,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.backgroundSecondary,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110, // Account for tab bar + spacing
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadow.lg,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  footerButtonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minWidth: 100,
  },
  skipButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700' as const,
    fontSize: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadProgressText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  addMediaText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  videoText: {
    ...Typography.caption,
    color: Colors.text,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  locationButtonText: {
    ...Typography.body,
    color: Colors.textLight,
    flex: 1,
  },
  locationButtonTextFilled: {
    color: Colors.text,
  },
  locationPickerContainer: {
    marginTop: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: 300,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  locationPickerScroll: {
    flex: 1,
  },
  locationPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  locationPickerDistrictItem: {
    paddingLeft: Spacing.xl,
  },
  locationPickerTextContainer: {
    flex: 1,
  },
  locationPickerCityText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  locationPickerDistrictText: {
    ...Typography.body,
    color: Colors.text,
  },
  locationPickerSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closePickerButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.backgroundSecondary,
  },
  closePickerText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },

  // ── Pro Auth Gate Styles ──────────────────────────────────────────
  authGateScrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  authGateCard: {
    maxWidth: 580,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  authGateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    marginBottom: 20,
  },
  authGateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  authGateIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  authGateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  authGateSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  authBenefitsList: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  authBenefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  authBenefitIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  authBenefitTextCol: {
    flex: 1,
  },
  authBenefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  authBenefitDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
  },
  authGateActions: {
    width: '100%',
    gap: 12,
  },
  authPrimaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    cursor: 'pointer' as any,
  },
  authPrimaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  authPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  authSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    cursor: 'pointer' as any,
  },
  authSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
