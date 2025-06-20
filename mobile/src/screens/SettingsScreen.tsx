import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/api';

export default function SettingsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Profile editing fields
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editBio, setEditBio] = useState('');
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    useEffect(() => {
        loadProfile();
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload profile pictures.');
            }
        }
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await authService.getProfile();
            setProfile(response.user);
            // Initialize edit fields with current values
            setEditName(response.user.name || '');
            setEditEmail(response.user.email || '');
            setEditPhoneNumber(response.user.phone_number || '');
            setEditBio(response.user.bio || '');
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const pickProfilePicture = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                
                // Check file size (10MB limit for profile pictures)
                if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
                    Alert.alert('File too large', 'Please select an image smaller than 10MB');
                    return;
                }
                
                // Generate proper filename
                let fileName = asset.fileName;
                if (!fileName) {
                    fileName = `profile_${Date.now()}.jpg`;
                } else {
                    // Ensure filename has proper extension
                    const existingExtension = fileName.toLowerCase().split('.').pop();
                    if (!existingExtension || !['jpg', 'jpeg', 'png', 'gif'].includes(existingExtension)) {
                        fileName = `${fileName.split('.')[0]}.jpg`;
                    }
                }
                
                const mediaData = {
                    uri: asset.uri,
                    type: 'image',
                    name: fileName,
                };
                
                setSelectedProfilePicture(mediaData);
            }
        } catch (error) {
            console.error('Error picking profile picture:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const removeProfilePicture = () => {
        setSelectedProfilePicture(null);
    };

    const handleUpdateProfile = async () => {
        // Basic validation
        if (!editName.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        if (!editEmail.trim()) {
            Alert.alert('Error', 'Email is required');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editEmail)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            let updateData: any = {
                name: editName.trim(),
                email: editEmail.trim(),
                phone_number: editPhoneNumber.trim() || null,
                bio: editBio.trim() || null,
            };

            // If a new profile picture is selected, upload it first
            if (selectedProfilePicture) {
                setUploadingPicture(true);
                try {
                    // Create FormData for profile picture upload
                    const formData = new FormData();
                    
                    // Determine the correct MIME type based on file extension
                    let mimeType = 'image/jpeg'; // default
                    const extension = selectedProfilePicture.name.toLowerCase().split('.').pop();
                    switch (extension) {
                        case 'png':
                            mimeType = 'image/png';
                            break;
                        case 'gif':
                            mimeType = 'image/gif';
                            break;
                        case 'jpg':
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            break;
                    }
                    
                    // Create file object for FormData
                    const fileData = {
                        uri: selectedProfilePicture.uri,
                        type: mimeType,
                        name: selectedProfilePicture.name,
                    };
                    
                    formData.append('profile_picture', fileData as any);
                    
                    // Upload profile picture using the new endpoint
                    const pictureResponse = await authService.uploadProfilePicture(formData);
                    
                    // Update the profile picture URL in our data
                    if (pictureResponse.profile_picture) {
                        updateData.profile_picture = pictureResponse.profile_picture;
                    }
                } catch (error) {
                    console.error('Error uploading profile picture:', error);
                    Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
                    setUploadingPicture(false);
                    return;
                } finally {
                    setUploadingPicture(false);
                }
            }

            // Update profile data (without profile picture if we already uploaded it)
            const response = await authService.updateProfile(updateData);
            setProfile(response.user);
            setShowEditProfile(false);
            setSelectedProfilePicture(null);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            console.error('Profile update error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            Alert.alert('Error', errorMessage);
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
                        {!showEditProfile ? (
                            <>
                                {profile && (
                                    <View style={styles.profileInfo}>
                                        {profile.profile_picture ? (
                                            <Image
                                                source={{ uri: profile.profile_picture }}
                                                style={styles.profileImage}
                                            />
                                        ) : (
                                            <View style={styles.profileImagePlaceholder}>
                                                <Text style={styles.profileImagePlaceholderText}>👤</Text>
                                            </View>
                                        )}
                                        <Text style={styles.profileText}>Name: {profile.name}</Text>
                                        <Text style={styles.profileText}>Email: {profile.email}</Text>
                                        <Text style={styles.profileText}>Phone: {profile.phone_number || ''}</Text>
                                        <Text style={styles.profileText}>Bio: {profile.bio || ''}</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => setShowEditProfile(true)}
                                >
                                    <Text style={styles.buttonText}>Edit Profile</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.profileForm}>
                                {/* Profile Picture Section */}
                                <View style={styles.profilePictureSection}>
                                    <Text style={styles.sectionSubtitle}>Profile Picture</Text>
                                    <View style={styles.profilePictureContainer}>
                                        {(selectedProfilePicture || profile?.profile_picture) ? (
                                            <Image
                                                source={{ 
                                                    uri: selectedProfilePicture?.uri || profile?.profile_picture 
                                                }}
                                                style={styles.profileImage}
                                            />
                                        ) : (
                                            <View style={styles.profileImagePlaceholder}>
                                                <Text style={styles.profileImagePlaceholderText}>👤</Text>
                                            </View>
                                        )}
                                        <View style={styles.profilePictureActions}>
                                            <TouchableOpacity
                                                style={styles.pictureButton}
                                                onPress={pickProfilePicture}
                                            >
                                                <Text style={styles.pictureButtonText}>
                                                    {selectedProfilePicture || profile?.profile_picture ? 'Change' : 'Add'} Photo
                                                </Text>
                                            </TouchableOpacity>
                                            {(selectedProfilePicture || profile?.profile_picture) && (
                                                <TouchableOpacity
                                                    style={[styles.pictureButton, styles.removePictureButton]}
                                                    onPress={removeProfilePicture}
                                                >
                                                    <Text style={styles.pictureButtonText}>Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    value={editName}
                                    onChangeText={setEditName}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number (optional)"
                                    value={editPhoneNumber}
                                    onChangeText={setEditPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Bio (optional)"
                                    value={editBio}
                                    onChangeText={setEditBio}
                                    multiline
                                    numberOfLines={3}
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={() => {
                                            setShowEditProfile(false);
                                            setSelectedProfilePicture(null);
                                            // Reset to original values
                                            setEditName(profile?.name || '');
                                            setEditEmail(profile?.email || '');
                                            setEditPhoneNumber(profile?.phone_number || '');
                                            setEditBio(profile?.bio || '');
                                        }}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleUpdateProfile}
                                        disabled={uploadingPicture}
                                    >
                                        <Text style={styles.buttonText}>
                                            {uploadingPicture ? 'Uploading...' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        alignSelf: 'center',
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
    profileForm: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    profilePictureSection: {
        marginBottom: 20,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    profilePictureContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    profileImagePlaceholderText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    profilePictureActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 10,
    },
    pictureButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    pictureButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    removePictureButton: {
        backgroundColor: '#FF3B30',
    },
}); 