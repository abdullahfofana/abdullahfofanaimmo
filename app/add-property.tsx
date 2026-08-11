import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Plus, ChevronLeft, Upload, FileText, Video, MapPin, Navigation, ChevronDown, Lock, CheckCircle2, LogIn, ArrowRight, Sparkles } from 'lucide-react-native';
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
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function AddPropertyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const { addSubmission } = usePropertySubmissions();
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
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
    coordinates: undefined,
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        agentName: prev.agentName || user.name || '',
        agentPhone: prev.agentPhone || user.phone || '',
      }));
    }
  }, [user]);

  const propertyTypes: PropertyType[] = ['apartment', 'house', 'villa', 'land', 'commercial'];
  const statusTypes: PropertyStatus[] = ['sale', 'rent'];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const updateField = (field: keyof FormData, value: string | PropertyType | PropertyStatus | PaymentMethod | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'city' && typeof value === 'string') {
        const location = ivoryCoastLocations.find(loc => loc.city === value);
        setAvailableDistricts(location ? location.districts : []);
        if (!location || !location.districts.includes(prev.district)) {
          newData.district = '';
        }
      }

      return newData;
    });
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

  const useMyLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          alert('Unable to fetch your location. Please enable GPS.');
        } else {
          Alert.alert('Permission Denied', 'Unable to fetch your location. Please enable GPS.');
        }
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude,
          longitude,
        },
      }));

      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode) {
        const address = `${reverseGeocode.street || ''} ${reverseGeocode.streetNumber || ''}`.trim();
        const city = reverseGeocode.city || reverseGeocode.region || '';
        const district = reverseGeocode.district || reverseGeocode.subregion || '';

        setFormData(prev => ({
          ...prev,
          address: address || prev.address,
          city: city || prev.city,
          district: district || prev.district,
        }));

        if (city) {
          const location = ivoryCoastLocations.find(loc => loc.city.toLowerCase().includes(city.toLowerCase()));
          if (location) {
            setAvailableDistricts(location.districts);
          }
        }
      }

      if (Platform.OS === 'web') {
        alert('Location retrieved successfully');
      } else {
        Alert.alert('Success', 'Location retrieved successfully');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      if (Platform.OS === 'web') {
        alert('Unable to fetch your location. Please enable GPS.');
      } else {
        Alert.alert('Error', 'Unable to fetch your location. Please enable GPS.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleDevSubmit = async () => {
    setIsSubmitting(true);
    console.log("[Dev] submitting test property...");
    try {
      const submission = await addSubmission({
        title: 'TEST — Sample 3BR Apartment (Dev)',
        description: 'Auto-created test property — ignore. For QA/dev verification of workflows.',
        price: 1000,
        type: 'apartment',
        status: 'rent',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        location: {
          address: 'Test Street',
          city: 'Abidjan',
          district: 'Cocody',
          coordinates: {
            latitude: 5.345,
            longitude: -4.027
          }
        },
        photos: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        document: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        features: ['WiFi', 'Parking', 'AC'],
        agent: {
          name: 'Dev Tester',
          phone: '0102030405',
        },
        payment: {
          method: 'orange_money',
          transactionId: 'DEV-TEST-' + Date.now(),
          amount: 10000,
        },
        is_test: true,
      });

      console.log("[Dev] dev_skip_property_submitted", { id: submission.id, timestamp: Date.now() });

      if (Platform.OS === 'web') {
        alert(t('add_property_dev_success'));
      } else {
        Alert.alert('Success', t('add_property_dev_success'));
      }

      router.replace('/dashboard');

    } catch (error) {
      console.error('Failed to submit dev property:', error);
      Alert.alert('Error', t('add_property_dev_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    console.log('[Submit] Starting property submission...');

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
      console.log('[Submit] Validation failed: missing required fields');
      if (Platform.OS === 'web') {
        alert(t('add_property_error'));
      } else {
        Alert.alert(t('add_property_error'));
      }
      return;
    }

    if (formData.photos.length !== 3 || !formData.document) {
      console.log('[Submit] Validation failed: missing media');
      if (Platform.OS === 'web') {
        alert(t('add_property_media_error'));
      } else {
        Alert.alert(t('add_property_media_error'));
      }
      return;
    }

    if (!formData.paymentMethod || !formData.transactionId) {
      console.log('[Submit] Validation failed: missing payment info');
      if (Platform.OS === 'web') {
        alert(t('add_property_payment_required'));
      } else {
        Alert.alert(t('add_property_payment_required'));
      }
      return;
    }

    if (formData.transactionId.trim().length < 5) {
      console.log('[Submit] Validation failed: invalid transaction ID');
      if (Platform.OS === 'web') {
        alert('Please enter a valid Transaction ID (minimum 5 characters)');
      } else {
        Alert.alert('Invalid Transaction ID', 'Please enter a valid Transaction ID (minimum 5 characters)');
      }
      return;
    }

    setIsSubmitting(true);
    console.log('[Submit] ✅ Validation passed, submitting to Firebase...');

    const submissionTimeout = setTimeout(() => {
      console.error('[Submit] ⏰ Submission timeout after 30 seconds');
      setIsSubmitting(false);
      if (Platform.OS === 'web') {
        alert('Request timeout. Please check your internet connection and try again.');
      } else {
        Alert.alert('Request Timeout', 'Please check your internet connection and try again.');
      }
    }, 30000);

    try {
      const submissionData = {
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
          coordinates: formData.coordinates,
        },
        photos: formData.photos,
        video: formData.video,
        document: formData.document,
        features: formData.features,
        agent: {
          name: formData.agentName,
          phone: formData.agentPhone,
        },
        payment: {
          method: formData.paymentMethod,
          transactionId: formData.transactionId.trim(),
          amount: 10000,
        },
      };

      console.log('[Submit] Calling addSubmission...');
      const result = await addSubmission(submissionData);
      console.log('[Submit] ✅ Property submitted successfully:', result.id);

      clearTimeout(submissionTimeout);
      setIsSubmitting(false);

      if (Platform.OS === 'web') {
        alert('✅ Success! Your property has been submitted for review.');
      } else {
        Alert.alert(
          'Success!',
          'Your property has been submitted for review. You will be notified once it is approved.',
          [
            {
              text: 'OK',
              onPress: () => handleBack(),
            },
          ]
        );
      }

      if (Platform.OS === 'web') {
        handleBack();
      }
    } catch (error) {
      clearTimeout(submissionTimeout);
      console.error('[Submit] ❌ FAILED to submit property');
      console.error('[Submit] Error:', error);
      console.error('[Submit] Error type:', error?.constructor?.name);
      console.error('[Submit] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[Submit] Error stack:', error instanceof Error ? error.stack : 'N/A');

      let errorTitle = 'Submission Failed';
      let errorMessage = 'Unable to submit your property. Please try again.';

      if (error instanceof Error) {
        console.log('[Submit] User-facing error:', errorTitle);
        console.log('[Submit] Error details:', error.message);
        errorMessage = error.message;

        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('Firebase') || error.message.includes('Firestore')) {
          errorTitle = 'Database Error';
          errorMessage = 'Unable to save your property. Please try again later or contact support.';
        } else if (error.message.includes('permission')) {
          errorTitle = 'Permission Denied';
          errorMessage = 'You do not have permission to submit properties. Please contact support.';
        }
      }

      if (Platform.OS === 'web') {
        alert(`${errorTitle}\n\n${errorMessage}`);
      } else {
        Alert.alert(errorTitle, errorMessage);
      }
    } finally {
      console.log('[Submit] Cleaning up...');
      setIsSubmitting(false);
    }
  };

  // ── Pro Auth Gate (Requires Login / Signup to Publish Property) ─────────
  if (!isAuthLoading && !user && !session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#F8FAFC' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('add_property_title')}</Text>
            <Text style={styles.headerSubtitle}>{t('add_property_subtitle')}</Text>
          </View>
        </View>
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
                onPress={handleBack}
                activeOpacity={0.75}
              >
                <Text style={styles.authSecondaryBtnText}>
                  {t('auth_gate_browse_btn') || 'Explorer les biens'}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('add_property_title')}</Text>
          <Text style={styles.headerSubtitle}>{t('add_property_subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('add_property_basic_info')}</Text>

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
            <Text style={styles.label}>{t('add_property_description_label')}</Text>
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
            <Text style={styles.label}>{t('add_property_price_label')}</Text>
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
          <Text style={styles.sectionTitle}>{t('add_property_details')}</Text>

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
              onChangeText={(text) => updateField('area', text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('add_property_location')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('add_property_address_label')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('add_property_address_placeholder')}
              placeholderTextColor={Colors.textLight}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('add_property_city_label')}</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setShowCityPicker(true)}
              >
                <Text style={[styles.pickerInputText, !formData.city && styles.pickerInputPlaceholder]}>
                  {formData.city || t('add_property_city_placeholder')}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('add_property_district_label')}</Text>
              <TouchableOpacity
                style={[styles.pickerInput, !formData.city && styles.pickerInputDisabled]}
                onPress={() => formData.city && setShowDistrictPicker(true)}
                disabled={!formData.city}
              >
                <Text style={[styles.pickerInputText, !formData.district && styles.pickerInputPlaceholder]}>
                  {formData.district || t('add_property_district_placeholder')}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.useLocationButton, isGettingLocation && styles.useLocationButtonDisabled]}
              onPress={useMyLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Navigation size={20} color={Colors.white} />
                  <Text style={styles.useLocationButtonText}>{t('add_property_use_my_location')}</Text>
                </>
              )}
            </TouchableOpacity>
            {formData.coordinates && (
              <View style={styles.coordinatesDisplay}>
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.coordinatesText}>
                  {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
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
                {formData.photos.length}/3 {formData.photos.length === 0 ? '— select up to 3 at once' : formData.photos.length < 3 ? `— ${3 - formData.photos.length} more allowed` : '— complete ✓'}
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
                  <Text style={styles.videoText}>{t('add_property_video_added')}</Text>
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
                  <Text style={styles.videoText}>{t('add_property_document_added')}</Text>
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

        <View style={styles.section}>
          <Text style={styles.paymentAmount}>{t('add_property_payment_desc')}</Text>

          <Text style={styles.sectionTitle}>{t('add_property_select_payment')}</Text>

          <View style={styles.paymentGrid}>
            {(['orange_money', 'mtn_money', 'moov', 'wave'] as PaymentMethod[]).map((method) => {
              const logoMap = {
                orange_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png',
                mtn_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/440px-New-mtn-logo.jpg',
                moov: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Moov_Africa.png/440px-Moov_Africa.png',
                wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Wave_Mobile_Money_logo.png/440px-Wave_Mobile_Money_logo.png',
              };

              const nameMap = {
                orange_money: 'ORANGE MONEY',
                mtn_money: 'MTN MONEY',
                moov: 'MOOV',
                wave: 'WAVE',
              };

              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentCard,
                    formData.paymentMethod === method && styles.paymentCardActive,
                  ]}
                  onPress={() => updateField('paymentMethod', method)}
                >
                  <Image
                    source={{ uri: logoMap[method] }}
                    style={styles.paymentLogo}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.paymentCardText,
                      formData.paymentMethod === method && styles.paymentCardTextActive,
                    ]}
                  >
                    {nameMap[method]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.transactionSection}>
            <Text style={styles.label}>Transaction ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter transaction ID"
              placeholderTextColor={Colors.textLight}
              value={formData.transactionId}
              onChangeText={(text) => updateField('transactionId', text)}
            />
          </View>
        </View>

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
                <Text style={styles.skipButtonText}>{t('add_property_skip_dev')}</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{t('add_property_submit')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showCityPicker} animationType="slide" transparent onRequestClose={() => setShowCityPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.white, paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_property_select_city')}</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)} style={styles.modalCloseButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {ivoryCoastLocations.map((location) => (
                <TouchableOpacity
                  key={location.city}
                  style={[
                    styles.modalItem,
                    formData.city === location.city && styles.modalItemActive
                  ]}
                  onPress={() => {
                    updateField('city', location.city);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.city === location.city && styles.modalItemTextActive
                  ]}>
                    {location.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDistrictPicker} animationType="slide" transparent onRequestClose={() => setShowDistrictPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.white, paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_property_select_district')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictPicker(false)} style={styles.modalCloseButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {availableDistricts.map((district) => (
                <TouchableOpacity
                  key={district}
                  style={[
                    styles.modalItem,
                    formData.district === district && styles.modalItemActive
                  ]}
                  onPress={() => {
                    updateField('district', district);
                    setShowDistrictPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.district === district && styles.modalItemTextActive
                  ]}>
                    {district}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
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
  footerButtonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
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
  paymentAmount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  paymentCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  paymentCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
    borderWidth: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
  },
  paymentCardText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center',
    fontSize: 13,
  },
  paymentCardTextActive: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  paymentLogo: {
    width: 60,
    height: 40,
    marginBottom: Spacing.xs,
  },
  transactionSection: {
    marginTop: Spacing.sm,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  useLocationButtonDisabled: {
    opacity: 0.6,
  },
  useLocationButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  coordinatesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  coordinatesText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  pickerInput: {
    ...Typography.body,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  pickerInputDisabled: {
    opacity: 0.5,
  },
  pickerInputText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  pickerInputPlaceholder: {
    color: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalItem: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalItemActive: {
    backgroundColor: Colors.primaryLight + '30',
  },
  modalItemText: {
    ...Typography.body,
    color: Colors.text,
  },
  modalItemTextActive: {
    color: Colors.primary,
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
