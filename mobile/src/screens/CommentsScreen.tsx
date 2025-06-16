import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commentService, programService } from '../services/api';

interface Comment {
    id: number;
    content: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    program_id: number;
    parent_id: number | null;
    media_type: string | null;
    media_url: string | null;
    user: {
        name: string;
    };
    replies: Comment[];
}

interface CommentsResponse {
    comments: Comment[];
}

interface Program {
    id: number;
    title: string;
    description: string;
    status: string;
    client_id: number;
    coach_id: number;
    current_week_id: number;
    current_day_id: number;
    completed_weeks: number;
    total_weeks: number;
    created_at: string;
    updated_at: string;
}

interface ProgramsResponse {
    programs: Program[];
}

export default function CommentsScreen() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgramId) {
            fetchComments();
        }
    }, [selectedProgramId]);

    const fetchPrograms = async () => {
        try {
            console.log('Fetching programs...');
            const response = await programService.getClientPrograms();
            console.log('Programs data:', response);
            const programsData = (response as ProgramsResponse).programs;
            setPrograms(programsData);
            if (programsData.length > 0) {
                setSelectedProgramId(programsData[0].id.toString());
            }
        } catch (err) {
            console.error('Error fetching programs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch programs');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        if (!selectedProgramId) return;
        
        try {
            console.log('Fetching comments for program:', selectedProgramId);
            const response = await commentService.getProgramComments(selectedProgramId);
            console.log('Comments data:', response);
            const commentsData = (response as CommentsResponse).comments;
            setComments(commentsData);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedProgramId) return;

        try {
            console.log('Adding new comment:', newComment);
            const response = await commentService.addProgramComment(selectedProgramId, newComment);
            console.log('Added comment response:', response);
            const addedComment = (response as Comment);
            setComments([addedComment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentContainer}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
            <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {item.replies && item.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {item.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyContainer}>
                            <Text style={styles.userName}>{reply.user.name}</Text>
                            <Text style={styles.commentText}>{reply.content}</Text>
                            <Text style={styles.timestamp}>
                                {new Date(reply.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Comments</Text>
            </View>

            {programs.length > 0 && (
                <View style={styles.programSelector}>
                    <Text style={styles.programLabel}>Select Program:</Text>
                    <FlatList
                        horizontal
                        data={programs}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.programButton,
                                    selectedProgramId === item.id.toString() && styles.selectedProgramButton
                                ]}
                                onPress={() => setSelectedProgramId(item.id.toString())}
                            >
                                <Text style={[
                                    styles.programButtonText,
                                    selectedProgramId === item.id.toString() && styles.selectedProgramButtonText
                                ]}>
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.programList}
                    />
                </View>
            )}
            
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderComment}
                contentContainerStyle={styles.commentsList}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                    multiline
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleAddComment}
                >
                    <Ionicons name="send" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    programSelector: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    programLabel: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    programList: {
        paddingRight: 16,
    },
    programButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    selectedProgramButton: {
        backgroundColor: '#007AFF',
    },
    programButtonText: {
        color: '#333',
    },
    selectedProgramButtonText: {
        color: '#fff',
    },
    commentsList: {
        padding: 16,
    },
    commentContainer: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    userName: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 16,
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
    },
    repliesContainer: {
        marginTop: 8,
        marginLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: '#ddd',
        paddingLeft: 8,
    },
    replyContainer: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
    },
    sendButton: {
        padding: 8,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
}); 