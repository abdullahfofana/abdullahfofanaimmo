import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  X,
  Plus,
  Minus,
  Video,
  FileText,
  Upload,
  MapPin,
  ChevronDown,
  ChevronRight,
  Navigation,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  Check,
  LogIn,
  ArrowRight,
  Home,
  Building,
  Building2,
  Trees,
  Briefcase,
  Layers,
  DollarSign,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Camera,
  CreditCard,
  User,
  Phone,
  HelpCircle,
  Eye,
  Info,
  CheckCheck,
  Search,
} from 'lucide-react-native';
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
import { useColors } from '@/hooks/useColors';

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

const POPULAR_AMENITIES = [
  { id: 'piscine', labelFr: 'Piscine', labelEn: 'Swimming Pool', icon: '🏊' },
  { id: 'securite', labelFr: 'Sécurité 24h/24', labelEn: '24/7 Security', icon: '🛡️' },
  { id: 'clim', labelFr: 'Climatisation', labelEn: 'Air Conditioning', icon: '❄️' },
  { id: 'parking', labelFr: 'Parking / Garage', labelEn: 'Parking / Garage', icon: '🚗' },
  { id: 'jardin', labelFr: 'Jardin privé', labelEn: 'Private Garden', icon: '🌿' },
  { id: 'groupe', labelFr: 'Groupe électrogène', labelEn: 'Power Generator', icon: '⚡' },
  { id: 'wifi', labelFr: 'WiFi Fibre Optique', labelEn: 'High-speed WiFi', icon: '📶' },
  { id: 'vue_mer', labelFr: 'Vue mer / Lagune', labelEn: 'Sea / Lagoon View', icon: '🌊' },
  { id: 'ascenseur', labelFr: 'Ascenseur', labelEn: 'Elevator', icon: '🛗' },
  { id: 'cuisine_equipee', labelFr: 'Cuisine équipée', labelEn: 'Fitted Kitchen', icon: '🍳' },
  { id: 'balcon', labelFr: 'Balcon / Terrasse', labelEn: 'Balcony / Terrace', icon: '☀️' },
  { id: 'cuve_eau', labelFr: 'Réserve d\'eau', labelEn: 'Water Tank Reserve', icon: '💧' },
];

const PROPERTY_TYPES_CONFIG: {
  type: PropertyType;
  labelFr: string;
  labelEn: string;
  subFr: string;
  subEn: string;
  icon: any;
}[] = [
  {
    type: 'apartment',
    labelFr: 'Appartement',
    labelEn: 'Apartment',
    subFr: 'Immeuble / Résidence',
    subEn: 'Building / Complex',
    icon: Building2,
  },
  {
    type: 'villa',
    labelFr: 'Villa',
    labelEn: 'Villa',
    subFr: 'Maison avec cour / standing',
    subEn: 'Luxury detached house',
    icon: Home,
  },
  {
    type: 'house',
    labelFr: 'Maison',
    labelEn: 'House',
    subFr: 'Maison basse / duplex',
    subEn: 'Townhouse / Duplex',
    icon: Building,
  },
  {
    type: 'land',
    labelFr: 'Terrain',
    labelEn: 'Land',
    subFr: 'Parcelle / Titre foncier',
    subEn: 'Plot / Land title',
    icon: Trees,
  },
  {
    type: 'commercial',
    labelFr: 'Commercial',
    labelEn: 'Commercial',
    subFr: 'Bureaux / Magasin / Entrepôt',
    subEn: 'Offices / Retail / Warehouse',
    icon: Briefcase,
  },
];

const POPULAR_ABIDJAN_DISTRICTS = [
  'Cocody',
  'Riviera 3',
  'Riviera Golf',
  'Plateau',
  'Marcory Zone 4',
  'Deux Plateaux',
  'Angré',
  'Bingerville',
  'Biétry',
  'Yopougon',
];

export default function AddPropertyScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const colors = useColors();
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const { addSubmission } = usePropertySubmissions();
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPropertyId, setSuccessPropertyId] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  // Safety auth timeout
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (!isAuthLoading) return;
    const timer = setTimeout(() => setAuthTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, [isAuthLoading]);
  const authReady = !isAuthLoading || authTimedOut;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'apartment',
    status: 'sale',
    price: '',
    bedrooms: '3',
    bathrooms: '2',
    area: '',
    address: '',
    city: 'Abidjan',
    district: 'Cocody',
    features: ['Piscine', 'Sécurité 24h/24', 'Climatisation'],
    agentName: '',
    agentPhone: '',
    photos: [],
    video: undefined,
    document: undefined,
    paymentMethod: undefined,
    transactionId: '',
  });

  // Pre-fill agent info if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        agentName: prev.agentName || user.name || '',
        agentPhone: prev.agentPhone || user.phone || '',
      }));
    }
  }, [user]);

  const generateDescMutation = trpc.ai.generateDescription.useMutation();
  const estimatePriceMutation = trpc.ai.estimatePrice.useMutation();
  const [estimatedPriceRange, setEstimatedPriceRange] = useState<string | null>(null);

  // Calculate form completion score for progress bar
  const formProgress = useMemo(() => {
    let completed = 0;
    const total = 7;
    if (formData.title && formData.type && formData.status) completed++;
    if (formData.description && formData.description.length > 20) completed++;
    if (formData.price && formData.area) completed++;
    if (formData.city && formData.district) completed++;
    if (formData.photos.length === 3) completed++;
    if (formData.document) completed++;
    if (formData.paymentMethod && formData.transactionId) completed++;
    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
    };
  }, [formData]);

  const handleGenerateDescription = async () => {
    if (!formData.type || !formData.city) {
      if (Platform.OS === 'web') alert(language === 'fr' ? 'Veuillez d\'abord choisir le type et la ville.' : 'Please select property type and location first.');
      else Alert.alert(language === 'fr' ? 'Info manquante' : 'Missing Info', language === 'fr' ? 'Veuillez d\'abord choisir le type et la ville.' : 'Please select property type and location first.');
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
            district: formData.district,
          },
        },
      });
      if (result?.description) {
        updateField('description', result.description);
        return;
      }
    } catch (e) {
      console.log('Using local AI description generator');
    }

    const typeLabel =
      formData.type === 'villa'
        ? (language === 'fr' ? 'Magnifique Villa de standing' : 'Stunning Luxury Villa')
        : formData.type === 'apartment'
        ? (language === 'fr' ? 'Superbe Appartement moderne' : 'Superb Modern Apartment')
        : formData.type === 'land'
        ? (language === 'fr' ? 'Terrain viabilisé avec ACD' : 'Serviced Land with Clear Title')
        : formData.type === 'house'
        ? (language === 'fr' ? 'Belle Maison familiale' : 'Beautiful Family Home')
        : (language === 'fr' ? 'Propriété d’exception' : 'Exceptional Property');

    const locLabel = formData.district ? `${formData.district}, ${formData.city}` : formData.city;
    const amenitiesText = formData.features.length > 0
      ? (language === 'fr' ? ` Prestations de qualité : ${formData.features.join(', ')}.` : ` Key amenities include: ${formData.features.join(', ')}.`)
      : '';

    const desc = language === 'fr'
      ? `${typeLabel} idéalement situé(e) à ${locLabel}. Offrant ${formData.bedrooms || '3'} chambres spacieuses, ${formData.bathrooms || '2'} salles d'eau modernes, et un cadre de vie sécurisé et recherché.${amenitiesText} Titre de propriété en règle (ACD / Certificat de propriété). Visite possible sur rendez-vous.`
      : `${typeLabel} ideally located in ${locLabel}. Featuring ${formData.bedrooms || '3'} spacious bedrooms, ${formData.bathrooms || '2'} modern bathrooms, within a secure and prestigious neighbourhood.${amenitiesText} Valid land title (ACD / Ownership Certificate). Visits available by appointment.`;

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
          location: { city: formData.city, district: formData.district },
        },
      });
      if (result?.estimation?.min && result?.estimation?.max) {
        const min = (result.estimation.min / 1000000).toFixed(1) + 'M';
        const max = (result.estimation.max / 1000000).toFixed(1) + 'M';
        setEstimatedPriceRange(`${min} - ${max} FCFA`);
        return;
      }
    } catch (e) {
      console.log('Using local AI price estimator fallback');
    }

    const areaNum = parseFloat(formData.area) || 120;
    const basePerM2 = formData.type === 'villa' ? 650000 : formData.type === 'apartment' ? 500000 : 250000;
    const estMin = ((areaNum * basePerM2 * 0.85) / 1000000).toFixed(1);
    const estMax = ((areaNum * basePerM2 * 1.15) / 1000000).toFixed(1);
    setEstimatedPriceRange(`${estMin}M - ${estMax}M FCFA`);
  };

  const updateField = (
    field: keyof FormData,
    value: string | PropertyType | PropertyStatus | PaymentMethod | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenityLabel: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(amenityLabel);
      if (exists) {
        return { ...prev, features: prev.features.filter(f => f !== amenityLabel) };
      } else {
        return { ...prev, features: [...prev.features, amenityLabel] };
      }
    });
  };

  const addCustomAmenity = () => {
    if (featureInput.trim()) {
      if (!formData.features.includes(featureInput.trim())) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, featureInput.trim()],
        }));
      }
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const adjustBedrooms = (delta: number) => {
    const current = parseInt(formData.bedrooms) || 0;
    const nextVal = Math.max(0, Math.min(20, current + delta));
    updateField('bedrooms', nextVal.toString());
  };

  const adjustBathrooms = (delta: number) => {
    const current = parseInt(formData.bathrooms) || 0;
    const nextVal = Math.max(0, Math.min(20, current + delta));
    updateField('bathrooms', nextVal.toString());
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
        const district = result.subregion || result.district || result.city || 'Cocody';
        const city = result.city || result.region || 'Abidjan';

        setFormData(prev => ({
          ...prev,
          address: street || prev.address,
          district: district,
          city: city,
        }));

        if (Platform.OS === 'web') {
          alert(language === 'fr' ? 'Position GPS détectée avec succès !' : 'GPS Location detected successfully!');
        } else {
          Alert.alert(
            language === 'fr' ? 'Succès' : 'Success',
            language === 'fr' ? 'Votre position a été détectée et appliquée.' : 'Your location has been detected and applied.',
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
      const msg = language === 'fr' ? 'Maximum 3 photos autorisées' : 'Maximum 3 photos allowed';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert(msg);
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
    console.log('[Dev] Starting DEV SKIP submission...');

    try {
      const testPayload = {
        title: 'TEST — Magnifique 4 Pièces Cocody Riviera (Dev Mode)',
        description: 'Propriété de test créée automatiquement pour valider le flux de soumission. ACD en règle, vue lagune, finitions haut de gamme.',
        price: 95000000,
        type: 'apartment' as PropertyType,
        status: 'sale' as PropertyStatus,
        bedrooms: 3,
        bathrooms: 2,
        area: 165,
        location: {
          address: 'Boulevard Mitterrand, Riviera 3',
          city: 'Abidjan',
          district: 'Cocody',
          coordinates: {
            latitude: 5.345,
            longitude: -4.027,
          },
        },
        photos: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        ],
        video: 'https://www.w3schools.com/html/mov_bbb.mp4',
        document: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        features: ['Piscine', 'Sécurité 24h/24', 'Climatisation', 'Parking', 'WiFi Fibre'],
        agent: {
          name: user?.name || 'Dev Test Agent',
          phone: user?.phone || '+225 0708091011',
        },
        payment: {
          method: 'orange_money' as PaymentMethod,
          transactionId: 'DEV-MODE-' + Date.now(),
          amount: 10000,
        },
        is_test: true,
      };

      const submission = await addSubmission(testPayload);
      setSuccessPropertyId(submission.id);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[Dev] Error submitting dev property:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web') alert(`Dev submission failed: ${msg}`);
      else Alert.alert('Error', `Failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
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
      const msg = language === 'fr'
        ? 'Veuillez remplir tous les champs obligatoires du formulaire.'
        : 'Please fill in all required fields.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert(language === 'fr' ? 'Champs incomplets' : 'Missing Information', msg);
      return;
    }

    if (formData.photos.length !== 3 || !formData.document) {
      const msg = language === 'fr'
        ? 'Veuillez ajouter exactement 3 photos et un justificatif de propriété (ACD/Titre).'
        : 'Please provide exactly 3 photos and a land title document.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert(language === 'fr' ? 'Médias requis' : 'Media Required', msg);
      return;
    }

    if (!formData.paymentMethod || !formData.transactionId) {
      const msg = language === 'fr'
        ? 'Veuillez sélectionner un moyen de paiement mobile et saisir l\'ID de transaction.'
        : 'Please select a payment method and enter the transaction ID.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert(language === 'fr' ? 'Paiement requis' : 'Payment Required', msg);
      return;
    }

    setIsSubmitting(true);

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

      setUploadProgress(language === 'fr' ? 'Envoi des fichiers en cours...' : 'Uploading files...');
      const result = await addSubmission(payload);
      setUploadProgress('');
      setSuccessPropertyId(result.id);
      setShowSuccessModal(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'apartment',
        status: 'sale',
        price: '',
        bedrooms: '3',
        bathrooms: '2',
        area: '',
        address: '',
        city: 'Abidjan',
        district: 'Cocody',
        features: [],
        agentName: user?.name || '',
        agentPhone: user?.phone || '',
        photos: [],
        video: undefined,
        document: undefined,
        paymentMethod: undefined,
        transactionId: '',
      });
    } catch (error) {
      console.error('[Submit] Error:', error);
      let errMsg = language === 'fr' ? 'Échec de la soumission de l\'annonce.' : 'Failed to submit property.';
      if (error instanceof Error) errMsg = error.message;
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
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
      bedrooms: '3',
      bathrooms: '2',
      area: '',
      address: '',
      city: 'Abidjan',
      district: 'Cocody',
      features: ['Piscine', 'Sécurité 24h/24'],
      agentName: user?.name || '',
      agentPhone: user?.phone || '',
      photos: [],
      video: undefined,
      document: undefined,
      paymentMethod: undefined,
      transactionId: '',
    });
  };

  // Quick fill helper for testing
  const handleQuickFill = () => {
    setFormData({
      title: 'Villa Moderne d\'Architecte avec Piscine à Cocody Riviera',
      description: 'Splendide villa d\'architecte de 5 pièces située dans le quartier résidentiel de Riviera 3. Finitions contemporaines, vaste séjour lumineux avec baies vitrées, cuisine américaine haut standing, suite parentale avec dressing, piscine privée et jardin arboré. Titre de propriété ACD en règle.',
      type: 'villa',
      status: 'sale',
      price: '185000000',
      bedrooms: '4',
      bathrooms: '4',
      area: '420',
      address: 'Rue des Ambassades, Riviera 3',
      city: 'Abidjan',
      district: 'Cocody',
      features: ['Piscine', 'Sécurité 24h/24', 'Climatisation', 'Parking / Garage', 'Jardin privé', 'Groupe électrogène', 'WiFi Fibre Optique'],
      agentName: user?.name || 'Jean-Marc Kouassi',
      agentPhone: user?.phone || '+225 07 48 22 19 00',
      photos: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      ],
      video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      document: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      paymentMethod: 'orange_money',
      transactionId: 'CI-OM-' + Math.floor(1000000 + Math.random() * 9000000),
    });
  };

  // Loading state
  if (!authReady) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>
          {language === 'fr' ? 'Chargement sécurisé...' : 'Securing workspace...'}
        </Text>
      </View>
    );
  }

  // Pro Auth Gate
  if (authReady && !session && !user && !bypassAuth) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#F8FAFC' }]}>
        <ScrollView
          contentContainerStyle={styles.authGateScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authGateCard}>
            <View style={styles.authGateBadge}>
              <Sparkles size={13} color="#059669" />
              <Text style={styles.authGateBadgeText}>
                {t('auth_gate_badge') || 'ESPACE PRO & VENDEURS'}
              </Text>
            </View>

            <LinearGradient
              colors={['#064e3b', '#047857', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authGateIconWrapper}
            >
              <Lock size={32} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>

            <Text style={styles.authGateTitle}>
              {t('auth_gate_title') || 'Connectez-vous pour publier une annonce'}
            </Text>
            <Text style={styles.authGateSubtitle}>
              {t('auth_gate_subtitle') || 'Pour garantir la sécurité et l\'authenticité des offres sur ImmoCI, vous devez vous connecter ou créer un compte vérifié avant de soumettre un bien.'}
            </Text>

            {/* 1-Click Instant Skip Button (Like Admin Page) */}
            <TouchableOpacity
              style={styles.instantAccessBtn}
              onPress={() => setBypassAuth(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.instantAccessGradient}
              >
                <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.instantAccessText}>
                  {language === 'fr' ? '⚡ Accès Direct — Publier sans Compte (1-Clic)' : '⚡ Direct Access — Post Without Login (1-Click)'}
                </Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

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

            <View style={styles.authGateActions}>
              <TouchableOpacity
                style={styles.guestAccessBtn}
                onPress={() => setBypassAuth(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.guestAccessBtnText}>
                  {language === 'fr' ? '⚡ Accéder directement au formulaire d\'annonce' : '⚡ Go directly to property submission form'}
                </Text>
              </TouchableOpacity>

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
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Filtered locations for modal
  const filteredLocations = ivoryCoastLocations.filter(loc => {
    if (!locationSearchQuery.trim()) return true;
    const q = locationSearchQuery.toLowerCase();
    return (
      loc.city.toLowerCase().includes(q) ||
      loc.districts.some(d => d.toLowerCase().includes(q))
    );
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ===== SUCCESS POPUP ===== */}
      <SubmissionSuccessPopup
        visible={showSuccessModal}
        propertyId={successPropertyId}
        onGoHome={handleSuccessClose}
        onAddAnother={handleAddAnother}
      />

      {/* ===== GOOGLE STITCH APP BAR & PROGRESS HEADER ===== */}
      <View style={styles.stitchHeader}>
        <View style={styles.stitchHeaderInner}>
          <View style={styles.stitchHeaderTopRow}>
            <View style={styles.stitchHeaderTitleGroup}>
              <View style={styles.stitchBadgePill}>
                <Building2 size={12} color="#059669" />
                <Text style={styles.stitchBadgePillText}>
                  {language === 'fr' ? 'ESPACE PUBLICATION' : 'LISTING STUDIO'}
                </Text>
              </View>
              <Text style={styles.stitchPageTitle}>{t('add_property_title') || 'Publier une annonce'}</Text>
            </View>

            {/* Quick Fill Button */}
            <TouchableOpacity
              onPress={handleQuickFill}
              style={styles.quickFillButton}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color="#059669" />
              <Text style={styles.quickFillButtonText}>
                {language === 'fr' ? 'Auto-Remplir' : 'Quick Fill'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stitch Stepper Progress Bar */}
          <View style={styles.progressTrackerContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressStepCountText}>
                {language === 'fr'
                  ? `Complété à ${formProgress.percentage}% (${formProgress.completed}/${formProgress.total} étapes)`
                  : `${formProgress.percentage}% Complete (${formProgress.completed}/${formProgress.total} steps)`}
              </Text>
              <Text style={styles.progressStatusTag}>
                {formProgress.percentage === 100
                  ? (language === 'fr' ? 'Prêt à publier ✓' : 'Ready to publish ✓')
                  : (language === 'fr' ? 'En cours de saisie' : 'Drafting')}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarIndicator,
                  { width: `${Math.max(8, formProgress.percentage)}%` },
                ]}
              />
            </View>
          </View>
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
          <View style={styles.pageCenterContainer}>
            {/* ═════════════════════════════════════════════════════════════
                SECTION 1: TYPE & INFOS DE BASE (Google Stitch Surface Card)
            ═════════════════════════════════════════════════════════════ */}
            <View style={styles.stitchCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Layers size={18} color="#059669" strokeWidth={2.4} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardStepNumber}>ÉTAPE 1</Text>
                  <Text style={styles.cardTitle}>{t('add_property_basic_info') || 'Informations de base'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {language === 'fr'
                      ? 'Type de bien, modalité d\'offre et titre principal'
                      : 'Property classification, transaction type and title'}
                  </Text>
                </View>
              </View>

              {/* Property Type Grid (Stitch Selectable Cards) */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{t('add_property_type_label') || 'Type de bien'} *</Text>
                <View style={styles.propertyTypeGrid}>
                  {PROPERTY_TYPES_CONFIG.map(item => {
                    const isSelected = formData.type === item.type;
                    const IconComponent = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.type}
                        style={[
                          styles.typeCard,
                          isSelected && styles.typeCardActive,
                        ]}
                        onPress={() => updateField('type', item.type)}
                        activeOpacity={0.78}
                      >
                        <View
                          style={[
                            styles.typeCardIconCircle,
                            isSelected && styles.typeCardIconCircleActive,
                          ]}
                        >
                          <IconComponent
                            size={18}
                            color={isSelected ? '#059669' : '#64748B'}
                            strokeWidth={isSelected ? 2.4 : 1.8}
                          />
                        </View>
                        <View style={styles.typeCardContent}>
                          <Text
                            style={[
                              styles.typeCardTitle,
                              isSelected && styles.typeCardTitleActive,
                            ]}
                          >
                            {language === 'fr' ? item.labelFr : item.labelEn}
                          </Text>
                          <Text style={styles.typeCardSub}>
                            {language === 'fr' ? item.subFr : item.subEn}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedCheckBadge}>
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Transaction Type Segmented Toggle */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{t('add_property_status_label') || 'Type d\'offre'} *</Text>
                <View style={styles.segmentedToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.segmentOption,
                      formData.status === 'sale' && styles.segmentOptionActive,
                    ]}
                    onPress={() => updateField('status', 'sale')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentOptionText,
                        formData.status === 'sale' && styles.segmentOptionTextActive,
                      ]}
                    >
                      🏷️ {language === 'fr' ? 'À Vendre (Vente)' : 'For Sale'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentOption,
                      formData.status === 'rent' && styles.segmentOptionActive,
                    ]}
                    onPress={() => updateField('status', 'rent')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentOptionText,
                        formData.status === 'rent' && styles.segmentOptionTextActive,
                      ]}
                    >
                      🔑 {language === 'fr' ? 'À Louer (Location)' : 'For Rent'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Property Title */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{t('add_property_title_label') || 'Titre de l\'annonce'} *</Text>
                <View style={styles.inputContainer}>
                  <Home size={18} color="#94A3B8" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInputField}
                    placeholder={t('add_property_title_placeholder') || 'ex: Magnifique Villa 5 Pièces à Cocody Riviera'}
                    placeholderTextColor="#94A3B8"
                    value={formData.title}
                    onChangeText={text => updateField('title', text)}
                  />
                </View>
              </View>

              {/* Description & AI Magic Generator */}
              <View style={styles.formGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>{t('add_property_description_label') || 'Description détaillée'} *</Text>
                  <TouchableOpacity
                    onPress={handleGenerateDescription}
                    disabled={generateDescMutation.isPending}
                    style={styles.aiMagicPill}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(5, 150, 105, 0.12)', 'rgba(16, 185, 129, 0.18)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.aiMagicPillGradient}
                    >
                      {generateDescMutation.isPending ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <Sparkles size={13} color="#059669" />
                      )}
                      <Text style={styles.aiMagicPillText}>
                        {generateDescMutation.isPending
                          ? (language === 'fr' ? 'Génération IA...' : 'Generating...')
                          : (language === 'fr' ? '✨ Rédiger avec IA' : '✨ AI Assist')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.textInputField, styles.textAreaField]}
                    placeholder={t('add_property_description_placeholder') || 'Décrivez les atouts majeurs du bien, la luminosité, l\'état des installations...'}
                    placeholderTextColor="#94A3B8"
                    value={formData.description}
                    onChangeText={text => updateField('description', text)}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.fieldHint}>
                  {language === 'fr'
                    ? '💡 Astuce : Mentionnez la proximité des commerces, écoles et la sécurité du quartier.'
                    : '💡 Tip: Mention nearby shops, schools and neighbourhood security.'}
                </Text>
              </View>
            </View>

            {/* ═════════════════════════════════════════════════════════════
                SECTION 2: CARACTÉRISTIQUES, PRIX & COMMODITÉS
            ═════════════════════════════════════════════════════════════ */}
            <View style={styles.stitchCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                  <Maximize2 size={18} color="#D97706" strokeWidth={2.4} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={[styles.cardStepNumber, { color: '#D97706' }]}>ÉTAPE 2</Text>
                  <Text style={styles.cardTitle}>{t('add_property_details') || 'Caractéristiques & Prix'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {language === 'fr'
                      ? 'Tarif, superficie, pièces et équipements inclus'
                      : 'Pricing, square meters, rooms and included amenities'}
                  </Text>
                </View>
              </View>

              {/* Price with AI Estimate Banner */}
              <View style={styles.formGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>{t('add_property_price_label') || 'Prix du bien (FCFA)'} *</Text>
                  {estimatedPriceRange && (
                    <View style={styles.estimatedPriceChip}>
                      <Sparkles size={11} color="#059669" />
                      <Text style={styles.estimatedPriceChipText}>
                        Est. Marché : {estimatedPriceRange}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <DollarSign size={18} color="#D97706" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInputField}
                    placeholder="ex: 85000000"
                    placeholderTextColor="#94A3B8"
                    value={formData.price}
                    onChangeText={text => updateField('price', text)}
                    keyboardType="numeric"
                  />
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyBadgeText}>FCFA (XOF)</Text>
                  </View>
                </View>
              </View>

              {/* Specs Row: Bedrooms & Bathrooms Steppers + Area */}
              <View style={styles.specsRow}>
                {/* Bedrooms Counter */}
                <View style={styles.specColumn}>
                  <Text style={styles.fieldLabel}>{t('add_property_bedrooms_label') || 'Chambres'}</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustBedrooms(-1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={15} color="#475569" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.stepperValueBox}>
                      <Bed size={14} color="#059669" />
                      <Text style={styles.stepperValueText}>{formData.bedrooms || '0'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustBedrooms(1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={15} color="#475569" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bathrooms Counter */}
                <View style={styles.specColumn}>
                  <Text style={styles.fieldLabel}>{t('add_property_bathrooms_label') || 'Salles d\'eau'}</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustBathrooms(-1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={15} color="#475569" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.stepperValueBox}>
                      <Bath size={14} color="#059669" />
                      <Text style={styles.stepperValueText}>{formData.bathrooms || '0'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustBathrooms(1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={15} color="#475569" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Surface Area */}
                <View style={styles.specColumn}>
                  <Text style={styles.fieldLabel}>{t('add_property_area_label') || 'Surface (m²)'} *</Text>
                  <View style={styles.areaInputContainer}>
                    <TextInput
                      style={styles.areaInputField}
                      placeholder="ex: 150"
                      placeholderTextColor="#94A3B8"
                      value={formData.area}
                      onChangeText={text => {
                        updateField('area', text);
                        if (text.length > 1) setTimeout(handleEstimatePrice, 800);
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.areaUnitText}>m²</Text>
                  </View>
                </View>
              </View>

              {/* Popular Amenities Chips Grid (Stitch One-Tap Toggle) */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  {t('add_property_features_label') || 'Équipements & Commodités'}
                </Text>
                <Text style={styles.fieldHint}>
                  {language === 'fr'
                    ? 'Sélectionnez les commodités disponibles pour valoriser votre annonce :'
                    : 'Tap to select amenities included with this property:'}
                </Text>

                <View style={styles.amenitiesGrid}>
                  {POPULAR_AMENITIES.map(amenity => {
                    const label = language === 'fr' ? amenity.labelFr : amenity.labelEn;
                    const isSelected = formData.features.includes(label);
                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[
                          styles.amenityChip,
                          isSelected && styles.amenityChipSelected,
                        ]}
                        onPress={() => toggleAmenity(label)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                        <Text
                          style={[
                            styles.amenityChipText,
                            isSelected && styles.amenityChipTextSelected,
                          ]}
                        >
                          {label}
                        </Text>
                        {isSelected && (
                          <Check size={13} color="#059669" strokeWidth={2.8} style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Amenity Input */}
                <View style={styles.customAmenityRow}>
                  <TextInput
                    style={styles.customAmenityInput}
                    placeholder={language === 'fr' ? '+ Ajouter un équipement personnalisé...' : '+ Add custom feature...'}
                    placeholderTextColor="#94A3B8"
                    value={featureInput}
                    onChangeText={setFeatureInput}
                    onSubmitEditing={addCustomAmenity}
                  />
                  <TouchableOpacity
                    style={styles.customAmenityAddBtn}
                    onPress={addCustomAmenity}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.customAmenityAddBtnText}>
                      {language === 'fr' ? 'Ajouter' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Active Custom Tags */}
                {formData.features.filter(f => !POPULAR_AMENITIES.some(a => (language === 'fr' ? a.labelFr : a.labelEn) === f)).length > 0 && (
                  <View style={styles.customTagsList}>
                    {formData.features
                      .filter(f => !POPULAR_AMENITIES.some(a => (language === 'fr' ? a.labelFr : a.labelEn) === f))
                      .map((customFeature, idx) => (
                        <View key={idx} style={styles.customTagPill}>
                          <Text style={styles.customTagPillText}>{customFeature}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              const realIdx = formData.features.indexOf(customFeature);
                              if (realIdx !== -1) removeFeature(realIdx);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <X size={13} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </View>

            {/* ═════════════════════════════════════════════════════════════
                SECTION 3: LOCALISATION & GEOLOCALISATION
            ═════════════════════════════════════════════════════════════ */}
            <View style={styles.stitchCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <MapPin size={18} color="#2563EB" strokeWidth={2.4} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={[styles.cardStepNumber, { color: '#2563EB' }]}>ÉTAPE 3</Text>
                  <Text style={styles.cardTitle}>{t('add_property_location') || 'Localisation'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {language === 'fr'
                      ? 'Ville, commune / quartier et adresse exacte'
                      : 'City, neighborhood and precise street address'}
                  </Text>
                </View>
              </View>

              {/* City & District Selector Bar */}
              <View style={styles.formGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>{t('add_property_city_label') || 'Ville & Quartier'} *</Text>
                  <TouchableOpacity
                    style={styles.gpsLocationBtn}
                    onPress={handleUseMyLocation}
                    disabled={isFetchingLocation}
                    activeOpacity={0.8}
                  >
                    {isFetchingLocation ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <>
                        <Navigation size={13} color="#059669" strokeWidth={2.4} />
                        <Text style={styles.gpsLocationBtnText}>
                          {language === 'fr' ? 'Ma Position GPS' : 'Use My GPS'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Dropdown trigger card */}
                <TouchableOpacity
                  onPress={() => setShowLocationPicker(true)}
                  style={styles.locationSelectorCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.locationSelectorLeft}>
                    <MapPin size={18} color="#059669" />
                    <View>
                      <Text style={styles.locationSelectorCity}>
                        {formData.city || 'Abidjan'}
                      </Text>
                      <Text style={styles.locationSelectorDistrict}>
                        {formData.district || (language === 'fr' ? 'Sélectionner un quartier...' : 'Select district...')}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={18} color="#64748B" />
                </TouchableOpacity>

                {/* Quick Abidjan district pills */}
                <View style={styles.quickDistrictsRow}>
                  <Text style={styles.quickDistrictsLabel}>{language === 'fr' ? 'Populaires :' : 'Popular:'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDistrictsScroll}>
                    {POPULAR_ABIDJAN_DISTRICTS.map(district => (
                      <TouchableOpacity
                        key={district}
                        style={[
                          styles.quickDistrictPill,
                          formData.district === district && styles.quickDistrictPillActive,
                        ]}
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            city: 'Abidjan',
                            district: district,
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.quickDistrictPillText,
                            formData.district === district && styles.quickDistrictPillTextActive,
                          ]}
                        >
                          {district}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Exact Address / Street */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{t('add_property_address_label') || 'Adresse / Rue / Repère'} *</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={18} color="#94A3B8" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInputField}
                    placeholder={t('add_property_address_placeholder') || 'ex: Boulevard de Marseille, près de l\'ambassade'}
                    placeholderTextColor="#94A3B8"
                    value={formData.address}
                    onChangeText={text => updateField('address', text)}
                  />
                </View>
              </View>
            </View>

            {/* ═════════════════════════════════════════════════════════════
                SECTION 4: MÉDIAS & JUSTIFICATIF (3 Photos + Video + Doc)
            ═════════════════════════════════════════════════════════════ */}
            <View style={styles.stitchCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                  <Camera size={18} color="#7C3AED" strokeWidth={2.4} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={[styles.cardStepNumber, { color: '#7C3AED' }]}>ÉTAPE 4</Text>
                  <Text style={styles.cardTitle}>{t('add_property_media') || 'Photos & Documents Officiels'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {language === 'fr'
                      ? '3 photos obligatoires, vidéo optionnelle et titre foncier (ACD)'
                      : '3 required photos, optional video and land title ownership proof'}
                  </Text>
                </View>
              </View>

              {/* Photo Studio 3-Slot Grid */}
              <View style={styles.formGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>
                    {t('add_property_photos_label') || 'Photos de la propriété'} (3 obligatoires) *
                  </Text>
                  <View
                    style={[
                      styles.photoCountBadge,
                      formData.photos.length === 3 && styles.photoCountBadgeComplete,
                    ]}
                  >
                    {formData.photos.length === 3 ? (
                      <CheckCheck size={12} color="#059669" />
                    ) : null}
                    <Text
                      style={[
                        styles.photoCountBadgeText,
                        formData.photos.length === 3 && styles.photoCountBadgeTextComplete,
                      ]}
                    >
                      {formData.photos.length}/3 {formData.photos.length === 3 ? 'Complet ✓' : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.photoSlotsGrid}>
                  {[0, 1, 2].map(index => {
                    const photoUri = formData.photos[index];
                    const isCover = index === 0;

                    if (photoUri) {
                      return (
                        <View key={index} style={styles.photoSlotFilled}>
                          <Image source={{ uri: photoUri }} style={styles.photoSlotImage} />
                          {isCover && (
                            <View style={styles.coverPhotoBadge}>
                              <Sparkles size={10} color="#FFFFFF" />
                              <Text style={styles.coverPhotoBadgeText}>
                                {language === 'fr' ? 'Photo Principale' : 'Cover Photo'}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.photoDeleteBtn}
                            onPress={() => removePhoto(index)}
                            activeOpacity={0.8}
                          >
                            <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.photoSlotEmpty,
                          isCover && styles.photoSlotEmptyCover,
                        ]}
                        onPress={pickImage}
                        activeOpacity={0.75}
                      >
                        <View style={styles.uploadIconCircle}>
                          <Upload size={18} color="#059669" strokeWidth={2.4} />
                        </View>
                        <Text style={styles.photoSlotEmptyTitle}>
                          {isCover
                            ? (language === 'fr' ? 'Photo Principale *' : 'Cover Photo *')
                            : (language === 'fr' ? `Photo N°${index + 1} *` : `Photo #${index + 1} *`)}
                        </Text>
                        <Text style={styles.photoSlotEmptySub}>
                          {language === 'fr' ? 'Appuyez pour ajouter' : 'Tap to upload'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Video & Land Title Document (Side by Side / Stacked) */}
              <View style={styles.mediaExtraGrid}>
                {/* Optional Video Card */}
                <View style={styles.mediaExtraCard}>
                  <View style={styles.mediaExtraHeader}>
                    <Video size={16} color="#059669" />
                    <Text style={styles.mediaExtraTitle}>
                      {t('add_property_video_label') || 'Visite Vidéo (Optionnel)'}
                    </Text>
                  </View>

                  {formData.video ? (
                    <View style={styles.mediaUploadedCard}>
                      <View style={styles.mediaUploadedInfo}>
                        <Video size={20} color="#059669" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mediaUploadedName} numberOfLines={1}>
                            Vidéo de visite ajoutée
                          </Text>
                          <Text style={styles.mediaUploadedStatus}>Prêt à être publié ✓</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateField('video', undefined)}
                        style={styles.mediaRemoveIconBtn}
                      >
                        <X size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.mediaUploadBox}
                      onPress={pickVideo}
                      activeOpacity={0.75}
                    >
                      <Video size={22} color="#64748B" />
                      <Text style={styles.mediaUploadBoxText}>
                        {language === 'fr' ? '+ Ajouter un clip vidéo' : '+ Add property video'}
                      </Text>
                      <Text style={styles.mediaUploadBoxHint}>MP4 / MOV jusqu'à 50 Mo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Mandatory Legal Document (ACD / Titre Foncier) Card */}
                <View style={styles.mediaExtraCard}>
                  <View style={styles.mediaExtraHeader}>
                    <ShieldCheck size={16} color="#2563EB" />
                    <Text style={styles.mediaExtraTitle}>
                      {t('add_property_document_label') || 'Titre de Propriété (ACD/Bail)'} *
                    </Text>
                  </View>

                  {formData.document ? (
                    <View style={[styles.mediaUploadedCard, { borderColor: 'rgba(37, 99, 235, 0.3)' }]}>
                      <View style={styles.mediaUploadedInfo}>
                        <FileText size={20} color="#2563EB" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mediaUploadedName} numberOfLines={1}>
                            Document vérifié (PDF/Image)
                          </Text>
                          <Text style={[styles.mediaUploadedStatus, { color: '#2563EB' }]}>
                            Titre joint ✓
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateField('document', undefined)}
                        style={styles.mediaRemoveIconBtn}
                      >
                        <X size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.mediaUploadBox, { borderColor: 'rgba(37, 99, 235, 0.3)' }]}
                      onPress={pickDocument}
                      activeOpacity={0.75}
                    >
                      <FileText size={22} color="#2563EB" />
                      <Text style={[styles.mediaUploadBoxText, { color: '#2563EB' }]}>
                        {language === 'fr' ? '+ Joindre ACD ou Titre Foncier *' : '+ Attach Land Title Document *'}
                      </Text>
                      <Text style={styles.mediaUploadBoxHint}>
                        {language === 'fr' ? 'Garantie d\'authenticité pour les acheteurs' : 'Confidential verification guarantee'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* ═════════════════════════════════════════════════════════════
                SECTION 5: CONTACT & PAIEMENT FRAIS DE PUBLICATION
            ═════════════════════════════════════════════════════════════ */}
            <View style={styles.stitchCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <CreditCard size={18} color="#059669" strokeWidth={2.4} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardStepNumber}>ÉTAPE 5</Text>
                  <Text style={styles.cardTitle}>{t('add_property_contact') || 'Contact & Frais de Publication'}</Text>
                  <Text style={styles.cardSubtitle}>
                    {language === 'fr'
                      ? 'Coordonnées de l\'annonceur et règlement des frais de dossier (10 000 FCFA)'
                      : 'Publisher contact and 10,000 FCFA listing fee'}
                  </Text>
                </View>
              </View>

              {/* Agent Name & Phone */}
              <View style={styles.contactRow}>
                <View style={styles.contactCol}>
                  <Text style={styles.fieldLabel}>{t('add_property_name_label') || 'Nom & Prénom'} *</Text>
                  <View style={styles.inputContainer}>
                    <User size={17} color="#94A3B8" style={styles.inputLeadingIcon} />
                    <TextInput
                      style={styles.textInputField}
                      placeholder="ex: Jean-Marc Kouassi"
                      placeholderTextColor="#94A3B8"
                      value={formData.agentName}
                      onChangeText={text => updateField('agentName', text)}
                    />
                  </View>
                </View>

                <View style={styles.contactCol}>
                  <Text style={styles.fieldLabel}>{t('add_property_phone_label') || 'Téléphone (WhatsApp)'} *</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={17} color="#94A3B8" style={styles.inputLeadingIcon} />
                    <TextInput
                      style={styles.textInputField}
                      placeholder="ex: +225 07 48 22 19 00"
                      placeholderTextColor="#94A3B8"
                      value={formData.agentPhone}
                      onChangeText={text => updateField('agentPhone', text)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Payment Method Cards */}
              <View style={styles.formGroup}>
                <View style={styles.feeBanner}>
                  <View style={styles.feeBannerLeft}>
                    <ShieldCheck size={18} color="#059669" />
                    <View>
                      <Text style={styles.feeBannerTitle}>
                        {language === 'fr' ? 'Frais de publication vérifiée' : 'Verified listing fee'}
                      </Text>
                      <Text style={styles.feeBannerSub}>
                        {language === 'fr'
                          ? 'Audit du bien + Diffusion prioritaire 60 jours'
                          : 'Property audit + 60 days priority promotion'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.feeAmountBadge}>
                    <Text style={styles.feeAmountText}>10 000 FCFA</Text>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                  {t('add_property_select_payment') || 'Sélectionnez votre opérateur Mobile Money'} *
                </Text>

                <View style={styles.paymentGrid}>
                  {(['orange_money', 'wave', 'mtn_money', 'moov'] as PaymentMethod[]).map(method => {
                    const logoMap: Record<PaymentMethod, string> = {
                      orange_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png',
                      wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Wave_Mobile_Money_logo.png/440px-Wave_Mobile_Money_logo.png',
                      mtn_money: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/440px-New-mtn-logo.jpg',
                      moov: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Moov_Africa.png/440px-Moov_Africa.png',
                    };
                    const nameMap: Record<PaymentMethod, string> = {
                      orange_money: 'Orange Money',
                      wave: 'Wave Côte d\'Ivoire',
                      mtn_money: 'MTN Mobile Money',
                      moov: 'Moov Money',
                    };
                    const isSelected = formData.paymentMethod === method;

                    return (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentCard,
                          isSelected && styles.paymentCardSelected,
                        ]}
                        onPress={() => updateField('paymentMethod', method)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.paymentCardLeft}>
                          <Image
                            source={{ uri: logoMap[method] }}
                            style={styles.paymentCardLogo}
                            resizeMode="contain"
                          />
                          <Text
                            style={[
                              styles.paymentCardName,
                              isSelected && styles.paymentCardNameSelected,
                            ]}
                          >
                            {nameMap[method]}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Transaction ID Input */}
                <View style={[styles.formGroup, { marginTop: 14 }]}>
                  <Text style={styles.fieldLabel}>
                    {t('add_property_transaction_id') || 'Numéro / ID de transaction Mobile Money'} *
                  </Text>
                  <View style={styles.inputContainer}>
                    <CreditCard size={18} color="#94A3B8" style={styles.inputLeadingIcon} />
                    <TextInput
                      style={styles.textInputField}
                      placeholder={t('add_property_transaction_id_placeholder') || 'ex: CI-OM-98471203 ou Wave TXN-4421'}
                      placeholderTextColor="#94A3B8"
                      value={formData.transactionId}
                      onChangeText={text => updateField('transactionId', text)}
                    />
                  </View>
                  <Text style={styles.fieldHint}>
                    {language === 'fr'
                      ? 'ℹ️ Entrez la référence reçue par SMS après avoir transféré les 10 000 FCFA.'
                      : 'ℹ️ Enter the reference code received via SMS upon transferring 10,000 FCFA.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ═════════════════════════════════════════════════════════════
            STICKY GOOGLE STITCH FOOTER CTA
        ═════════════════════════════════════════════════════════════ */}
        <View style={styles.stickyFooter}>
          <View style={styles.stickyFooterInner}>
            {__DEV__ && (
              <TouchableOpacity
                style={styles.devSkipFooterBtn}
                onPress={handleDevSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.devSkipFooterBtnText}>⚡ Skip (Dev)</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <AnimatedSubmitButton
                label={language === 'fr' ? 'Publier mon annonce' : 'Publish My Listing'}
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isSuccess={showSuccessModal}
                progressLabel={uploadProgress || undefined}
                colors={['#059669', '#047857']}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ═════════════════════════════════════════════════════════════
          SEARCHABLE LOCATION PICKER MODAL
      ═════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={20} color="#059669" />
                <Text style={styles.modalTitle}>
                  {language === 'fr' ? 'Choisir la ville et le quartier' : 'Select City & District'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Search Bar */}
            <View style={styles.modalSearchBox}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={language === 'fr' ? 'Rechercher Cocody, Marcory, Yamoussoukro...' : 'Search neighborhood or city...'}
                placeholderTextColor="#94A3B8"
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
                autoFocus={Platform.OS !== 'web'}
              />
              {locationSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Locations List */}
            <ScrollView style={styles.modalScrollList} showsVerticalScrollIndicator={false}>
              {filteredLocations.map(location => (
                <View key={location.city} style={styles.modalLocationSection}>
                  <TouchableOpacity
                    style={styles.modalCityHeader}
                    onPress={() => handleSelectLocation(location.city)}
                    activeOpacity={0.7}
                  >
                    <Building2 size={16} color="#059669" />
                    <Text style={styles.modalCityHeaderText}>{location.city}</Text>
                  </TouchableOpacity>

                  <View style={styles.modalDistrictsGrid}>
                    {location.districts.map(district => (
                      <TouchableOpacity
                        key={`${location.city}-${district}`}
                        style={[
                          styles.modalDistrictItem,
                          formData.district === district && formData.city === location.city && styles.modalDistrictItemActive,
                        ]}
                        onPress={() => handleSelectLocation(location.city, district)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.modalDistrictItemText,
                            formData.district === district && formData.city === location.city && styles.modalDistrictItemTextActive,
                          ]}
                        >
                          {district}
                        </Text>
                        {formData.district === district && formData.city === location.city && (
                          <Check size={12} color="#059669" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE STITCH STYLESHEET
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Warm Stitch off-white canvas
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Stitch App Header & Progress Stepper ───────────────────────
  stitchHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  stitchHeaderInner: {
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  stitchHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stitchHeaderTitleGroup: {
    flex: 1,
  },
  stitchBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  stitchBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  stitchPageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  quickFillButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // Progress Bar Tracker
  progressTrackerContainer: {
    marginTop: 2,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressStepCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressStatusTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarIndicator: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#059669',
  },

  // ── Scroll Content ─────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 190, // Room for sticky footer
  },
  pageCenterContainer: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },

  // ── Google Stitch Surface Card ─────────────────────────────────
  stitchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(241, 245, 249, 0.9)',
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardStepNumber: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // ── Form Elements ──────────────────────────────────────────────
  formGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 6,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Input styling
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInputField: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaField: {
    height: '100%',
    lineHeight: 22,
  },

  // ── Property Type Grid (Stitch Cards) ──────────────────────────
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  typeCardActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    borderColor: '#059669',
  },
  typeCardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeCardIconCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeCardContent: {
    flex: 1,
  },
  typeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  typeCardTitleActive: {
    color: '#059669',
  },
  typeCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Segmented Toggle (Sale vs Rent) ────────────────────────────
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 14,
    gap: 6,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // ── AI Magic Pill ──────────────────────────────────────────────
  aiMagicPill: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiMagicPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
  },
  aiMagicPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // ── Pricing & Specs ────────────────────────────────────────────
  currencyBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  currencyBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  estimatedPriceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estimatedPriceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Specs Column
  specsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  specColumn: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 6,
    height: 50,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  areaInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  areaInputField: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  areaUnitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Amenities Grid ─────────────────────────────────────────────
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  amenityChipSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: '#059669',
  },
  amenityIcon: {
    fontSize: 14,
  },
  amenityChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  amenityChipTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  customAmenityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  customAmenityInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
  },
  customAmenityAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
  },
  customAmenityAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  customTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customTagPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  // ── Location & GPS ─────────────────────────────────────────────
  gpsLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  gpsLocationBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  locationSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationSelectorCity: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationSelectorDistrict: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 1,
  },
  quickDistrictsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  quickDistrictsLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  quickDistrictsScroll: {
    gap: 6,
  },
  quickDistrictPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDistrictPillActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: '#059669',
  },
  quickDistrictPillText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  quickDistrictPillTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // ── Media Photo Studio ─────────────────────────────────────────
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoCountBadgeComplete: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  photoCountBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  photoCountBadgeTextComplete: {
    color: '#059669',
  },
  photoSlotsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoSlotFilled: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoSlotImage: {
    width: '100%',
    height: '100%',
  },
  coverPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverPhotoBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  photoSlotEmpty: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  photoSlotEmptyCover: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.03)',
  },
  uploadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  photoSlotEmptyTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  photoSlotEmptySub: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  // Media Extra Cards (Video + Document)
  mediaExtraGrid: {
    marginTop: 16,
    gap: 14,
  },
  mediaExtraCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  mediaExtraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mediaExtraTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  mediaUploadBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  mediaUploadBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  mediaUploadBoxHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mediaUploadedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  mediaUploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mediaUploadedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  mediaUploadedStatus: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  mediaRemoveIconBtn: {
    padding: 6,
  },

  // ── Contact & Payment ──────────────────────────────────────────
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactCol: {
    flex: 1,
  },
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderRadius: 14,
    padding: 14,
  },
  feeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  feeBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#064E3B',
  },
  feeBannerSub: {
    fontSize: 11.5,
    color: '#047857',
    marginTop: 2,
  },
  feeAmountBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  feeAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  paymentCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  paymentCardSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    borderColor: '#059669',
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paymentCardLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  paymentCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentCardNameSelected: {
    color: '#059669',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },

  // ── Sticky Footer ──────────────────────────────────────────────
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  stickyFooterInner: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devSkipFooterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devSkipFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // ── Location Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  modalScrollList: {
    maxHeight: 450,
  },
  modalLocationSection: {
    marginBottom: 18,
  },
  modalCityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalCityHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  modalDistrictsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalDistrictItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modalDistrictItemActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
  },
  modalDistrictItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  modalDistrictItemTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // ── Auth Gate Styles ───────────────────────────────────────────
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
  },
  authSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  instantAccessBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  instantAccessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  instantAccessText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  guestAccessBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAccessBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  devBypassBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(5, 150, 105, 0.35)',
    alignItems: 'center',
  },
  devBypassText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
