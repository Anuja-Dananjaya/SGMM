import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Import your screens
import LoginScreen from './screens/LoginScreen';
import ScannerScreen from './screens/ScannerScreen';
import ClassesScreen from './screens/ClassesScreen';

// Global Axios URL for Uni/Home Hotspot
axios.defaults.baseURL = 'http://192.168.8.115:5207';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Define the Bottom Navigation Bar
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Classes') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Attendance') {
                        iconName = focused ? 'qr-code' : 'qr-code-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#28a745',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { backgroundColor: '#1a1a1a', borderTopWidth: 0 },
                headerStyle: { backgroundColor: '#1a1a1a' },
                headerTintColor: '#fff'
            })}
        >
            <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Gym Classes' }} />
            <Tab.Screen name="Attendance" component={ScannerScreen} options={{ title: 'QR Check-in' }} />
        </Tab.Navigator>
    );
}

// 2. Define the Main App Stack
export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                />
                {/* After login, navigate to "Main" to show the tabs */}
                <Stack.Screen 
                    name="Main" 
                    component={MainTabs} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}