import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { programService, commentService, authService } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    DailyExercises: undefined;
    Comments: { programId: string; programTitle: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Comment {
    content: string;
    user: {
        name: string;
        role: string; // 'client' or 'coach'
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
    const [currentProgram, setCurrentProgram] = useState<any>(null);
    const navigation = useNavigation<NavigationProp>();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            setError(null);
            const programData = await programService.getClientPrograms();

            if (!programData || !programData.programs || programData.programs.length === 0) {
                throw new Error('No program data available');
            }

            // Get the first program from the array
            const program = programData.programs[0];
            setCurrentProgram(program);
            
            // Calculate completion percentage
            const completion = program.completed_weeks 
                ? Math.round((program.completed_weeks / program.total_weeks) * 100)
                : 0;

            // Set client name from the program's client data
            setClientName(program.client?.name || 'Guest');
            
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
                        mediaUrl: comment.media_url
                    }))
                    .sort((a: TransformedComment, b: TransformedComment) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by newest first
                    .slice(0, 5); // Limit to 5 comments
                setRecentComments(transformedComments);
            } else {
                setRecentComments([]);
            }
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

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Recent Coach Comments</Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Comments', {
                                programId: currentProgram?.id.toString(),
                                programTitle: programName
                            })}
                            style={styles.viewAllButton}
                        >
                            <Text style={styles.viewAllButtonText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentComments && recentComments.length > 0 ? (
                        recentComments.map((comment, index) => (
                            <View key={index} style={styles.commentContainer}>
                                <View style={styles.commentHeader}>
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
                        <Text style={styles.noCommentsText}>No recent coach comments</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Progress</Text>
                    <Text style={styles.cardText}>{currentWeek} - {currentDay}</Text>
                    <TouchableOpacity 
                        style={styles.startButton}
                        onPress={() => navigation.navigate('DailyExercises')}
                    >
                        <Text style={styles.startButtonText}>Start Workout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{programName}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
                    </View>
                    <Text style={styles.cardText}>{completionPercentage}% Complete</Text>
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
}); 