import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const CreateSelectionScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('createSelectionTitle')}</Text>
      <TouchableOpacity
        style={[styles.selectionButton, { marginBottom: 20 }]}
        onPress={() => navigation.navigate('CreateActivity')}
      >
        <Text style={styles.buttonText}>{t('createActivityPost')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => navigation.navigate('CreateHobby')}
      >
        <Text style={styles.buttonText}>{t('createHobbyClass')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 40,
  },
  selectionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#6200EE',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateSelectionScreen;
