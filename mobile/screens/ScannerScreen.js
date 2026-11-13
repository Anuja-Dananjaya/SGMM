import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // State 1: Permissions are loading
    if (!permission) {
        return <View style={styles.container} />;
    }

    // State 2: Permissions not granted yet
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Camera Permission Required</Text>
                <Text style={styles.subtitle}>We need access to your camera to scan the check-in QR code.</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // State 3: Camera active and scanning
    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);

        try {
            const userToken = await SecureStore.getItemAsync('token');

            if (!userToken) {
                Alert.alert("Error", "Authentication missing. Please log in again.");
                navigation.navigate("Login");
                return;
            }

            // Global Axios config automatically prepends the Uni/Home IP
            const response = await axios.post('/api/checkin/scan', 
                { ScannedQRCode: data },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            );

            Alert.alert("Check-In Successful!", "Welcome to the gym!", [
                { text: "OK", onPress: () => navigation.goBack() } 
            ]);

             } catch (error) {
            // This grabs the specific validation error C# sent back (e.g., "The Token field is required")
            const backendError = error.response?.data?.errors || error.response?.data || error.message;
            console.error("Backend Error Details:", JSON.stringify(backendError, null, 2));

            Alert.alert("Check-In Failed", "Look at your PC terminal to see the exact C# error.", [
             { text: "Scan Again", onPress: () => setScanned(false) }
    ]);
}
    };

    // ... keep your handleBarCodeScanned function exactly the same ...

    return (
        <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr"],
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.scanBox} />
                <Text style={styles.scanText}>Point camera at the front desk QR code</Text>
            </View>
        </CameraView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        padding: 20,
    },
    camera: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#28a745',
        textAlign: 'center',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)', // Adds a slight dark tint around the scanner box
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#28a745',
        backgroundColor: 'transparent',
        marginBottom: 20,
    },
    scanText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 5,
        overflow: 'hidden',
    }
});
