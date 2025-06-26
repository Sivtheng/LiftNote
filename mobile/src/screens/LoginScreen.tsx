import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { authService, questionnaireService } from '../services/api';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoginLoading(true);
            const response = await authService.login(email, password);
            
            // Check questionnaire status
            try {
                const questionnaireResponse = await questionnaireService.getQuestions();
                if (questionnaireResponse.questionnaire?.status === 'completed') {
                    // If questionnaire is completed, go to main app
                    navigation.replace('MainApp');
                } else {
                    // If questionnaire is not completed or doesn't exist, go to questionnaire screen
                    navigation.replace('Questionnaire');
                }
            } catch (error) {
                console.error('Error checking questionnaire status:', error);
                // If there's an error getting questionnaire, go to questionnaire screen
                navigation.replace('Questionnaire');
            }
        } catch (error: any) {
            Alert.alert(
                'Login Failed',
                error.response?.data?.message || 'Please check your credentials and try again'
            );
        } finally {
            setLoginLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        try {
            setForgotLoading(true);
            const response = await authService.requestPasswordReset(email);
            Alert.alert(
                'Password Reset',
                'A password reset link has been sent to your email. Please check your inbox.',
            );
        } catch (error: any) {
            console.error('Password reset error:', error);
            console.error('Error response:', error.response?.data);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to send password reset email'
            );
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.form}>
                <Text style={styles.title}>Welcome to LiftNote</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text style={styles.eyeButtonText}>
                            {showPassword ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={handleForgotPassword}
                    disabled={loginLoading || forgotLoading}
                >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, (loginLoading || forgotLoading) && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loginLoading || forgotLoading}
                >
                    <Text style={styles.buttonText}>
                        {loginLoading ? 'Logging in...' : forgotLoading ? 'Sending reset email...' : 'Login'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        marginBottom: 0,
    },
    eyeButton: {
        position: 'absolute',
        right: 15,
        height: 50,
        justifyContent: 'center',
    },
    eyeButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 