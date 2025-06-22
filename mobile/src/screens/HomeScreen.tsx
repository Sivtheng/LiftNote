import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { programService, commentService, authService } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
    DailyExercises: { programId: string };
    Comments: { programId: string; programTitle: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Comment {
    content: string;
    user: {
        name: string;
        role: string; // 'client' or 'coach'
        profile_picture?: string;
    };
    created_at: string;
    media_type?: string | null;
    media_url?: string | null;
}

interface TransformedComment {
    author: string;
    text: string;
    isCoach: boolean;
    createdAt: Date;
    mediaType?: string | null;
    mediaUrl?: string | null;
    profilePicture?: string | null;
}

interface Program {
    id: number;
    title: string;
    current_week?: any;
    current_day?: any;
    completed_weeks?: number;
    total_weeks?: number;
}

export default function HomeScreen() {
    const [clientName, setClientName] = useState('Loading...');
    const [currentWeek, setCurrentWeek] = useState('Loading...');
    const [currentDay, setCurrentDay] = useState('Loading...');
    const [programName, setProgramName] = useState('Loading...');
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [recentComments, setRecentComments] = useState<TransformedComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allPrograms, setAllPrograms] = useState<Program[]>([]);
    const [activeProgramIndex, setActiveProgramIndex] = useState(0);
    const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
    const navigation = useNavigation<NavigationProp>();
    const [refreshing, setRefreshing] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            // Use refreshProgramData to maintain current program selection
            if (allPrograms.length > 0) {
                refreshProgramData();
            } else {
                // Only use fetchData for initial load when no programs exist
                fetchData();
            }
        }, [])
    );

    // Update current program when active program index changes
    useEffect(() => {
        if (allPrograms.length > 0 && activeProgramIndex < allPrograms.length) {
            const program = allPrograms[activeProgramIndex];
            setCurrentProgram(program);
            updateProgramDisplay(program);
        }
    }, [activeProgramIndex, allPrograms]);

    const getCurrentUser = async () => {
        try {
            // Try to get user data from API first
            const response = await authService.getProfile();
            if (response.user) {
                return response.user.name;
            }
            
            // Fallback to AsyncStorage if API fails
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.name;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            // Try AsyncStorage as fallback
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    return user.name;
                }
            } catch (storageError) {
                console.error('Error getting user from storage:', storageError);
            }
        }
        return 'Guest';
    };

    const updateProgramDisplay = async (program: Program) => {
        // Calculate completion percentage
        const completion = program.completed_weeks && program.total_weeks
            ? Math.round((program.completed_weeks / program.total_weeks) * 100)
            : 0;

        // Get current week and day from the program
        const currentWeek = program.current_week;
        const currentDay = program.current_day;
        
        // If we have a current day but no current week, something is wrong
        if (currentDay && !currentWeek) {
            console.error('Program has current day but no current week:', program);
            setCurrentWeek('Error: No Week Assigned');
            setCurrentDay(`Day ${currentDay.order}`);
        } else {
            setCurrentWeek(currentWeek ? `Week ${currentWeek.order}` : 'No Week Assigned');
            setCurrentDay(currentDay ? `Day ${currentDay.order}` : 'No Day Assigned');
        }
        
        setProgramName(program.title || 'No Program Assigned');
        setCompletionPercentage(completion);

        // Fetch comments for this program
        try {
            const commentsData = await commentService.getCoachComments(program.id.toString());

            // Transform comments data to match our expected format
            if (commentsData && commentsData.comments) {
                const transformedComments = commentsData.comments
                    .map((comment: Comment) => ({
                        author: comment.user?.name || 'Anonymous',
                        text: comment.content,
                        isCoach: comment.user?.role === 'coach',
                        createdAt: new Date(comment.created_at),
                        mediaType: comment.media_type,
                        mediaUrl: comment.media_url,
                        profilePicture: comment.user?.profile_picture || null,
                    }))
                    .sort((a: TransformedComment, b: TransformedComment) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by newest first
                    .slice(0, 5); // Limit to 5 comments
                setRecentComments(transformedComments);
            } else {
                setRecentComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments for program:', program.id, error);
            setRecentComments([]);
        }
    };

    const refreshProgramData = async () => {
        try {
            const programData = await programService.getClientPrograms();
            
            if (programData && programData.programs && programData.programs.length > 0) {
                setAllPrograms(programData.programs);
                
                // Ensure the active program index is still valid
                if (activeProgramIndex >= programData.programs.length) {
                    setActiveProgramIndex(0);
                }
                
                // Update the display for the current active program
                if (allPrograms.length > 0 && activeProgramIndex < allPrograms.length) {
                    const program = allPrograms[activeProgramIndex];
                    await updateProgramDisplay(program);
                }
            }
        } catch (error) {
            console.error('Error refreshing program data:', error);
        }
    };

    const fetchData = async () => {
        try {
            setError(null);
            
            // Get current user name first
            const userName = await getCurrentUser();
            setClientName(userName);
            
            const programData = await programService.getClientPrograms();

            // Handle case when client has no programs
            if (!programData || !programData.programs || programData.programs.length === 0) {
                // Set default values for new clients with no programs
                setCurrentWeek('No Program Assigned');
                setCurrentDay('No Day Assigned');
                setProgramName('No Program Assigned');
                setCompletionPercentage(0);
                setRecentComments([]);
                setCurrentProgram(null);
                setAllPrograms([]);
                setLoading(false);
                return; // Exit early, don't throw error
            }

            // Store all programs
            setAllPrograms(programData.programs);
            
            // Maintain current selection if valid, otherwise set to first program
            const validIndex = activeProgramIndex < programData.programs.length ? activeProgramIndex : 0;
            setActiveProgramIndex(validIndex);
            
            // The useEffect will handle updating the display for the active program

        } catch (error: any) {
            console.error('Error fetching data:', error);
            console.error('Error details:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Failed to load data. Please try again later.');
            setRecentComments([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const renderProgramSelector = () => {
        if (allPrograms.length <= 1) return null;

        return (
            <View style={styles.programSelectorContainer}>
                <Text style={styles.programSelectorTitle}>Select Program</Text>
                <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setDropdownVisible(true)}
                >
                    <Text style={styles.dropdownButtonText}>
                        {allPrograms[activeProgramIndex]?.title || 'Select a program'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#007AFF" />
                </TouchableOpacity>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={dropdownVisible}
                    onRequestClose={() => setDropdownVisible(false)}
                >
                    <Pressable 
                        style={styles.modalOverlay}
                        onPress={() => setDropdownVisible(false)}
                    >
                        <View style={styles.dropdownModal}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Select Program</Text>
                                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.dropdownList}>
                                {allPrograms.map((program, index) => (
                                    <TouchableOpacity
                                        key={program.id}
                                        style={[
                                            styles.dropdownItem,
                                            index === activeProgramIndex && styles.dropdownItemActive
                                        ]}
                                        onPress={() => {
                                            setActiveProgramIndex(index);
                                            setDropdownVisible(false);
                                            // Refresh program data without resetting selection
                                            refreshProgramData();
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            index === activeProgramIndex && styles.dropdownItemTextActive
                                        ]}>
                                            {program.title}
                                        </Text>
                                        {index === activeProgramIndex && (
                                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>
            </View>
        );
    };

    const renderMedia = (mediaUrl: string, mediaType: string) => {
        if (mediaType === 'image') {
            return (
                <Image
                    source={{ uri: mediaUrl }}
                    style={styles.commentMedia}
                    resizeMode="contain"
                />
            );
        } else if (mediaType === 'video') {
            return (
                <Video
                    source={{ uri: mediaUrl }}
                    style={styles.commentMedia}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                />
            );
        }
        return null;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>LiftNote</Text>
            </View>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#007AFF"]}
                        tintColor="#007AFF"
                    />
                }
            >
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Hello, {clientName}</Text>
                    <Text style={styles.subtitle}>Ready to get your workout in for the day?</Text>
                </View>

                {renderProgramSelector()}

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Recent Coach Comments</Text>
                        {currentProgram && (
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Comments', {
                                    programId: currentProgram.id.toString(),
                                    programTitle: programName
                                })}
                                style={styles.viewAllButton}
                            >
                                <Text style={styles.viewAllButtonText}>View All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {recentComments && recentComments.length > 0 ? (
                        recentComments.map((comment, index) => (
                            <View key={index} style={styles.commentContainer}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    {comment.profilePicture ? (
                                        <Image
                                            source={{ uri: comment.profilePicture }}
                                            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#eee' }}
                                        />
                                    ) : (
                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>{comment.author.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <Text style={[
                                        styles.commentAuthor,
                                        comment.isCoach && styles.coachComment
                                    ]}>
                                        {comment.author}
                                    </Text>
                                    <Text style={styles.commentTime}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                {comment.text && <Text style={styles.commentText}>{comment.text}</Text>}
                                {comment.mediaType && comment.mediaUrl && (
                                    <View style={styles.mediaContainer}>
                                        {renderMedia(comment.mediaUrl, comment.mediaType)}
                                    </View>
                                )}
                                {!comment.text && comment.mediaType && comment.mediaUrl && (
                                    <Text style={styles.mediaOnlyText}>
                                        {comment.mediaType === 'image' ? '📷 Image' : '🎥 Video'}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noCommentsText}>
                            {currentProgram ? 'No recent coach comments' : 'No comments available - no program assigned'}
                        </Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Progress</Text>
                    <Text style={styles.cardText}>{currentWeek} - {currentDay}</Text>
                    {currentProgram ? (
                        // Check if there are weeks and days assigned
                        (currentWeek !== 'No Week Assigned' && currentDay !== 'No Day Assigned') ? (
                            <TouchableOpacity 
                                style={styles.startButton}
                                onPress={() => navigation.navigate('DailyExercises', { programId: currentProgram.id.toString() })}
                            >
                                <Text style={styles.startButtonText}>Start Workout</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.disabledButton}>
                                <Text style={styles.disabledButtonText}>No Workout Available</Text>
                            </View>
                        )
                    ) : (
                        <View style={styles.disabledButton}>
                            <Text style={styles.disabledButtonText}>No Program Assigned</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{programName}</Text>
                    {currentProgram ? (
                        <>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
                            </View>
                            <Text style={styles.cardText}>{completionPercentage}% Complete</Text>
                        </>
                    ) : (
                        <Text style={styles.cardText}>Contact your coach to get assigned a program</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingLeft: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    cardText: {
        fontSize: 16,
        color: '#333',
    },
    progressBar: {
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginVertical: 10,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 5,
    },
    commentContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    commentAuthor: {
        fontWeight: 'bold',
        color: '#333',
    },
    coachComment: {
        color: '#007AFF',
    },
    commentTime: {
        fontSize: 12,
        color: '#666',
    },
    commentText: {
        marginLeft: 5,
        color: '#444',
    },
    noCommentsText: {
        color: '#666',
        fontStyle: 'italic',
    },
    startButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    viewAllButton: {
        padding: 5,
    },
    viewAllButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    commentMedia: {
        width: 200,
        height: 150,
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    mediaContainer: {
        marginTop: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaOnlyText: {
        color: '#666',
        fontStyle: 'italic',
        fontSize: 14,
        marginTop: 5,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    disabledButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    programSelectorContainer: {
        marginBottom: 20,
    },
    programSelectorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    dropdownButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    dropdownModal: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 10,
        maxHeight: '80%',
        marginTop: '20%',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    dropdownList: {
        maxHeight: 300,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemActive: {
        backgroundColor: '#f0f8ff',
    },
    dropdownItemText: {
        color: '#333',
        fontSize: 16,
    },
    dropdownItemTextActive: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
}); 