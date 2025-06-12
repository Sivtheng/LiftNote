import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { authService } from '../services/api';

export default function SettingsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await authService.getProfile();
            setProfile(response.user);
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.replace('Login');
        } catch (error) {
            Alert.alert('Logout Failed', 'Please try again.');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await authService.changePassword(currentPassword, newPassword, confirmPassword);
            Alert.alert(
                'Success', 
                'Password changed successfully. You will be logged out for security.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Force logout and navigate to login
                            navigation.replace('Login');
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await authService.deleteAccount();
                            navigation.replace('Login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Settings</Text>

                    {/* Profile Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profile</Text>
                        {profile && (
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileText}>Email: {profile.email}</Text>
                                <Text style={styles.profileText}>Name: {profile.name}</Text>
                            </View>
                        )}
                    </View>

                    {/* Password Management Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Password</Text>
                        {!showChangePassword ? (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setShowChangePassword(true)}
                            >
                                <Text style={styles.buttonText}>Change Password</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.passwordForm}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Current Password"
                                    secureTextEntry
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm New Password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={() => {
                                            setShowChangePassword(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                        }}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleChangePassword}
                                    >
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Account Management Section */}
                    {/* <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={handleDeleteAccount}
                        >
                            <Text style={styles.buttonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View> */}

                    {/* Logout Section */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    profileInfo: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
    },
    profileText: {
        fontSize: 16,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#8E8E93',
        flex: 1,
        marginRight: 5,
    },
    saveButton: {
        backgroundColor: '#34C759',
        flex: 1,
        marginLeft: 5,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    passwordForm: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
}); 