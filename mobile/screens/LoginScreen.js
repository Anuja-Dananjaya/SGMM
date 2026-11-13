import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }

        try {
    const response = await axios.post('/api/Auth/login', {
        email: email,
        password: password
    });

    // Save token
    await SecureStore.setItemAsync('token', response.data.token);
    
    // Show success message
    Alert.alert("Success", "Logged in successfully!");
    
    // Force navigation instantly
    navigation.navigate("Scanner");
    
} catch (error) {
    console.error("Login Error:", error);
    Alert.alert("Login Failed", "Invalid email or password.");
}
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SGMM Check-In</Text>
            
            <View style={styles.card}>
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#1a1a1a', // Dark theme to match your gym UI
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#28a745', // Gym green
        textAlign: 'center',
        marginBottom: 40,
    },
    card: {
        backgroundColor: '#333',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});