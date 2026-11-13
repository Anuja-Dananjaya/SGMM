import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from 'axios';

// Import your screens
import LoginScreen from './screens/LoginScreen';
import ScannerScreen from './screens/ScannerScreen';

// Global Axios URL for Uni/Home Hotspot
axios.defaults.baseURL = 'http://192.168.8.115:5207';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Scanner" 
                    component={ScannerScreen} 
                    options={{ title: 'Scan QR Code' }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}