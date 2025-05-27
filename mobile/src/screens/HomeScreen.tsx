import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { programService, commentService, authService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    DailyExercises: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Comment {
    content: string;
    user: {
        name: string;
        role: string; // 'client' or 'coach'
    };
    created_at: string;
}

interface TransformedComment {
    author: string;
    text: string;
    isCoach: boolean;
    createdAt: Date;
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
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setError(null);
            console.log('Fetching program data...');
            const programData = await programService.getClientPrograms();
            console.log('Program data received:', programData);

            if (!programData || !programData.programs || programData.programs.length === 0) {
                throw new Error('No program data available');
            }

            // Get the first program from the array
            const currentProgram = programData.programs[0];
            
            // Calculate completion percentage
            const completion = currentProgram.completed_weeks 
                ? Math.round((currentProgram.completed_weeks / currentProgram.total_weeks) * 100)
                : 0;

            // Set client name from the program's client data
            setClientName(currentProgram.client?.name || 'Guest');
            setCurrentWeek(`Week ${currentProgram.completed_weeks + 1}`);
            setCurrentDay('Day 1'); // You might want to calculate this based on your program structure
            setProgramName(currentProgram.title || 'No Program Assigned');
            setCompletionPercentage(completion);

            // Fetch comments for this program
            console.log('Fetching comments data...');
            const commentsData = await commentService.getRecentComments(currentProgram.id.toString());
            console.log('Comments data received:', commentsData);

            // Transform comments data to match our expected format
            if (commentsData && commentsData.comments) {
                const transformedComments = commentsData.comments
                    .map((comment: Comment) => ({
                        author: comment.user?.name || 'Anonymous',
                        text: comment.content,
                        isCoach: comment.user?.role === 'coach',
                        createdAt: new Date(comment.created_at)
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
            >
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Hello, {clientName}</Text>
                    <Text style={styles.subtitle}>Ready to get your workout in for the day?</Text>
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

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Recent Comments</Text>
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
                                <Text style={styles.commentText}>{comment.text}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noCommentsText}>No recent comments</Text>
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
}); 