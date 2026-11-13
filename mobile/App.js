import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import axios from 'axios';

axios.defaults.baseURL = 'http://192.168.8.115:5207';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* We will add the QR Scanner screen right here next! */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}