import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Modal,
  FlatList,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

const languages = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
];

// Icon URLs
const menuIconUrl = 'https://cdn-icons-png.flaticon.com/512/1828/1828859.png';
const micIconUrl = 'https://cdn-icons-png.flaticon.com/512/727/727245.png';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  useEffect(() => {
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      setIsListening(false);
      setIsProcessing(false);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] ?? '';
      setRecognizedText(text);
    };

    Voice.onSpeechError = (error: SpeechErrorEvent) => {
      console.error('Speech error:', error);

      if (error.error?.code === '7') {
        Alert.alert(
          'No speech recognized',
          'Could not recognize speech, please try again.'
        );
      }

      setIsListening(false);
      setIsProcessing(false);
    };

    const requestMicPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Mic permission denied');
        }
      }
    };

    requestMicPermission();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setRecognizedText('');
    try {
      await Voice.start(selectedLanguage.code);
    } catch (e) {
      console.error('start error:', e);
      setIsProcessing(false);
    }
  };

  const stopListening = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await Voice.stop();
    } catch (e) {
      console.error('stop error:', e);
      setIsProcessing(false);
    }
  };

  const toggleModal = () => setModalVisible(!modalVisible);

  const selectLanguage = (language: { code: string; label: string }) => {
    setSelectedLanguage(language);
    toggleModal();
  };

  return (
    <View style={styles.screen}>
      {/* Header with Title and Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleModal} style={styles.hamburger}>
          <Image source={{ uri: menuIconUrl }} style={styles.iconImage} />
        </TouchableOpacity>
        <Text style={styles.title}>Feat Kids Listening</Text>
        <TouchableOpacity
          style={[
            styles.micButton,
            (isProcessing || !selectedLanguage) && { opacity: 0.6 },
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Image source={{ uri: micIconUrl }} style={styles.micImage} />
          {isListening && (
            <Animated.View
              style={[
                styles.listeningDot,
                { opacity: pulseAnim, transform: [{ scale: pulseAnim }] },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Speech Display */}
      <View style={styles.questionBox}>
        {/* Removed question text as requested */}
        {recognizedText ? (
          <Text style={styles.responseText}>{recognizedText}</Text>
        ) : null}
      </View>

      {/* Language Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleModal}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage.code === item.code && styles.selectedItem,
                  ]}
                  onPress={() => selectLanguage(item)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage.code === item.code && styles.selectedText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#004080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  hamburger: {
    padding: 6,
  },
  iconImage: {
    width: 28,
    height: 28,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  micButton: {
    backgroundColor: '#FFC107',
    borderRadius: 30,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micImage: {
    width: 28,
    height: 28,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  listeningDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
  },
  questionBox: {
    flex: 1,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  responseText: {
    color: '#FFEB3B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e0f7fa',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#00796B',
  },
});

export default App;
