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
import ProfileScreen from './screens/ProfileScreen';
import AttendanceHistoryScreen from './screens/AttendanceHistoryScreen';
import BookAppointmentScreen from './screens/BookAppointmentScreen';
import MyAppointmentsScreen from './screens/MyAppointmentsScreen';
import MyWorkoutPlanScreen from './screens/MyWorkoutPlanScreen';
import MyPaymentsScreen from './screens/MyPaymentsScreen';

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
                    
                    // Assign icons based on the route name
                    if (route.name === 'Classes') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Attendance') {
                        iconName = focused ? 'qr-code' : 'qr-code-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'MyAppointments') {
                        // FIX: Added icon logic for MyAppointments
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'MyWorkoutPlans') {
                        iconName = focused ? 'barbell' : 'barbell-outline';
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
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
            <Tab.Screen name="MyWorkoutPlans" component={MyWorkoutPlanScreen} options={{ title: 'Workouts' }} />
            
            {/* FIX: Changed <Stack.Screen> to <Tab.Screen> */}
            <Tab.Screen 
                name="MyAppointments" 
                component={MyAppointmentsScreen} 
                options={{ title: 'My Appointments' }} 
            />
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

                <Stack.Screen 
                    name="AttendanceHistory" 
                    component={AttendanceHistoryScreen} 
                    options={{ 
                        headerShown: true, // Overrides the global false so users can click "Back"
                        title: 'Attendance History',
                        headerStyle: { backgroundColor: '#1a1a1a' },
                        headerTintColor: '#fff'
                    }} 
                />

                <Stack.Screen 
                    name="BookAppointment" 
                    component={BookAppointmentScreen} 
                    options={{ 
                        headerShown: true, 
                        title: 'Schedule Session',
                        headerStyle: { backgroundColor: '#1a1a1a' },
                        headerTintColor: '#fff'
                    }} 
                />

                <Stack.Screen 
                    name="MyPayments" 
                    component={MyPaymentsScreen} 
                    options={{ 
                        headerShown: true, 
                        title: 'My Payments & Billing',
                        headerStyle: { backgroundColor: '#1a1a1a' },
                        headerTintColor: '#fff'
                    }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}