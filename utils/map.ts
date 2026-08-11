import { Platform, Linking, Alert } from 'react-native';

export const openInGoogleMaps = (latitude: number, longitude: number, label: string) => {
  const destination = `${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(googleMapsUrl).catch((err) => {
      console.error('Failed to open Google Maps:', err);
    });
  } else if (Platform.OS === 'android') {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(googleMapsUrl).catch((err) => {
      console.error('Failed to open Google Maps:', err);
    });
  } else {
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(webUrl);
  }
};

export const openInWaze = (latitude: number, longitude: number) => {
  const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Waze Not Installed', 'Please install Waze app to use this feature.');
    }
  });
};
