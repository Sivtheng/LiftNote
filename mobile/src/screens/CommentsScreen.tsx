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
    Image,
    Alert,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { commentService, programService, authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    name: string;
    role: string;
    profile_picture?: string;
}

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
    user: User;
    replies: Comment[];
    parent?: Comment;
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

interface CurrentUser {
    id: number;
    name: string;
    role: string;
}

export default function CommentsScreen() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyMedia, setReplyMedia] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);

    useEffect(() => {
        fetchPrograms();
        requestPermissions();
        getCurrentUser();
    }, []);

    useEffect(() => {
        if (selectedProgramId) {
            fetchComments();
        }
    }, [selectedProgramId]);

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (selectedProgramId) {
                fetchComments();
            }
        }, [selectedProgramId])
    );

    // Add this after useEffect hooks
    useFocusEffect(
        React.useCallback(() => {
            fetchPrograms();
        }, [])
    );

    const getCurrentUser = async () => {
        try {
            // Try to get user data from API first
            const response = await authService.getProfile();
            if (response.user) {
                setCurrentUser(response.user);
                return;
            }
            
            // Fallback to AsyncStorage if API fails
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setCurrentUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            // Try AsyncStorage as fallback
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    setCurrentUser(JSON.parse(userData));
                }
            } catch (storageError) {
                console.error('Error getting user from storage:', storageError);
            }
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload media.');
            }
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await programService.getClientPrograms();
            const programsData = (response as ProgramsResponse).programs;
            setPrograms(programsData);
            
            // Check if the currently selected program still exists
            if (selectedProgramId) {
                const programStillExists = programsData.some(program => program.id.toString() === selectedProgramId);
                if (!programStillExists) {
                    // Clear the selected program if it no longer exists
                    setSelectedProgramId(null);
                    setComments([]);
                    setError('The previously selected program is no longer available.');
                }
            }
            
            // Set the first program as selected if no program is currently selected
            if (!selectedProgramId && programsData.length > 0) {
                setSelectedProgramId(programsData[0].id.toString());
            }
            
            setError(null); // Clear any previous errors
        } catch (err: any) {
            console.error('Error fetching programs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch programs');
            // Clear programs and selected program on error
            setPrograms([]);
            setSelectedProgramId(null);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (isRefreshing = false) => {
        if (!selectedProgramId) return;

        // Check if selectedProgramId exists in the current programs list
        const programExists = programs.some(p => p.id.toString() === selectedProgramId);
        if (!programExists) {
            setSelectedProgramId(null);
            setComments([]);
            return;
        }

        try {
            if (isRefreshing) {
                setRefreshing(true);
            }
            const response = await commentService.getProgramComments(selectedProgramId);
            const commentsData = (response as CommentsResponse).comments;
            setComments(commentsData);
            setError(null); // Clear any previous errors
        } catch (err: any) {
            console.error('Error fetching comments:', err);
            
            // Check if the error is due to program not found (404)
            if (err.response?.status === 404) {
                setError('This program has been deleted or is no longer available.');
                // Clear the selected program since it no longer exists
                setSelectedProgramId(null);
                setComments([]);
                // Refresh the programs list to remove the deleted program
                fetchPrograms();
            } else {
                setError(err instanceof Error ? err.message : 'Failed to fetch comments');
            }
        } finally {
            if (isRefreshing) {
                setRefreshing(false);
            }
        }
    };

    const handleRefresh = () => {
        fetchComments(true);
    };

    const pickMedia = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: false, // Don't force cropping
                quality: 0.8,
                videoMaxDuration: 60, // Limit video to 60 seconds
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                
                // Check file size (100MB limit) - only check if fileSize is available and reasonable
                // For videos, fileSize might not be accurate, so we'll let the backend handle validation
                if (asset.fileSize && asset.fileSize > 0 && asset.fileSize < 10 * 1024 * 1024 * 1024) { // Less than 10GB to avoid obviously wrong values
                    if (asset.fileSize > 100 * 1024 * 1024) {
                        Alert.alert('File too large', 'Please select a file smaller than 100MB');
                        return;
                    }
                }
                
                // Determine file type and extension
                const isVideo = asset.type === 'video';
                const extension = isVideo ? 'mp4' : 'jpg';
                
                // Generate proper filename
                let fileName = asset.fileName;
                if (!fileName) {
                    // If no filename, generate one with proper extension
                    fileName = `media_${Date.now()}.${extension}`;
                } else {
                    // Ensure filename has proper extension
                    const existingExtension = fileName.toLowerCase().split('.').pop();
                    if (!existingExtension || (isVideo && existingExtension !== 'mp4' && existingExtension !== 'mov' && existingExtension !== 'avi') ||
                        (!isVideo && !['jpg', 'jpeg', 'png', 'gif'].includes(existingExtension))) {
                        fileName = `${fileName.split('.')[0]}.${extension}`;
                    }
                }
                
                const mediaData = {
                    uri: asset.uri,
                    type: asset.type || 'image',
                    name: fileName,
                };
                
                // Set media based on whether we're replying or adding a new comment
                if (replyingTo) {
                    setReplyMedia(mediaData);
                } else {
                    setSelectedMedia(mediaData);
                }
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to pick media. Please try again.');
        }
    };

    const removeMedia = () => {
        if (replyingTo) {
            setReplyMedia(null);
        } else {
            setSelectedMedia(null);
        }
    };

    const handleAddComment = async () => {
        if ((!newComment.trim() && !selectedMedia) || !selectedProgramId) return;

        try {
            setSubmitting(true);
            if (selectedMedia) {
                setUploadingMedia(true);
            }
            
            const response = await commentService.addProgramCommentWithMedia(
                selectedProgramId, 
                newComment, 
                selectedMedia
            );
            
            // Handle different response structures
            let addedComment: Comment;
            if (response.comment) {
                // Backend returns { comment: Comment }
                addedComment = response.comment;
            } else if (response.id) {
                // Direct comment object
                addedComment = response as Comment;
            } else {
                throw new Error('Invalid response structure from server');
            }
            
            setComments([addedComment, ...comments]);
            setNewComment('');
            setSelectedMedia(null);
        } catch (err) {
            console.error('Error adding comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        } finally {
            setSubmitting(false);
            setUploadingMedia(false);
        }
    };

    const handleReply = async () => {
        if ((!replyContent.trim() && !replyMedia) || !replyingTo || !selectedProgramId) return;

        try {
            setSubmitting(true);
            if (replyMedia) {
                setUploadingMedia(true);
            }
            const response = await commentService.addProgramCommentWithMedia(
                selectedProgramId, 
                replyContent, 
                replyMedia,
                replyingTo.toString()
            );
            
            // Refresh comments to get the updated structure
            await fetchComments();
            setReplyingTo(null);
            setReplyContent('');
            setReplyMedia(null);
        } catch (err) {
            console.error('Error adding reply:', err);
            setError(err instanceof Error ? err.message : 'Failed to add reply');
        } finally {
            setSubmitting(false);
            setUploadingMedia(false);
        }
    };

    const canEditComment = (comment: Comment): boolean => {
        
        if (!currentUser) return false;
        
        // Only text comments can be edited
        if (comment.media_type !== 'text') return false;
        
        // Admin can edit any text comment
        if (currentUser.role === 'admin') return true;
        
        // User can edit their own text comment
        if (currentUser.id === comment.user_id) return true;
        
        return false;
    };

    const canDeleteComment = (comment: Comment): boolean => {
        
        if (!currentUser) return false;
        
        // Admin can delete any comment
        if (currentUser.role === 'admin') return true;
        
        // User can delete their own comment
        if (currentUser.id === comment.user_id) return true;
        
        return false;
    };

    const handleStartEdit = (comment: Comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingComment(null);
        setEditContent('');
    };

    const handleSaveEdit = async (commentId: number) => {
        if (!editContent.trim() || !selectedProgramId) return;

        try {
            setSubmitting(true);
            const response = await commentService.updateComment(selectedProgramId, commentId.toString(), editContent);
            
            // Update comment in state
            const updateCommentInState = (comments: Comment[], targetId: number, updatedComment: Comment): Comment[] => {
                return comments.map(comment => {
                    if (comment.id === targetId) {
                        return {
                            ...comment,
                            content: updatedComment.content,
                            updated_at: updatedComment.updated_at
                        };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentInState(comment.replies, targetId, updatedComment)
                        };
                    }
                    return comment;
                });
            };

            setComments(prev => updateCommentInState(prev, commentId, response.comment));
            setEditingComment(null);
            setEditContent('');
        } catch (err) {
            console.error('Error updating comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to update comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            await commentService.deleteComment(selectedProgramId!, commentId.toString());
                            
                            // Remove comment from state
                            const removeCommentFromState = (comments: Comment[], targetId: number): Comment[] => {
                                return comments.filter(comment => {
                                    if (comment.id === targetId) {
                                        return false;
                                    }
                                    if (comment.replies && comment.replies.length > 0) {
                                        comment.replies = removeCommentFromState(comment.replies, targetId);
                                    }
                                    return true;
                                });
                            };

                            setComments(prev => removeCommentFromState(prev, commentId));
                        } catch (err) {
                            console.error('Error deleting comment:', err);
                            setError(err instanceof Error ? err.message : 'Failed to delete comment');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const renderMedia = (mediaUrl: string, mediaType: string) => {
        if (mediaType === 'image') {
            return (
                <Image
                    source={{ uri: mediaUrl }}
                    style={styles.mediaImage}
                    resizeMode="contain"
                />
            );
        } else if (mediaType === 'video') {
            return (
                <Video
                    source={{ uri: mediaUrl }}
                    style={styles.mediaVideo}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                />
            );
        }
        return null;
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'coach':
                return '#3B82F6';
            case 'admin':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getRoleBackgroundColor = (role: string) => {
        switch (role) {
            case 'coach':
                return '#DBEAFE';
            case 'admin':
                return '#FEE2E2';
            default:
                return '#F3F4F6';
        }
    };

    const renderComment = (comment: Comment, level: number = 0) => {
        // Safety check for comment
        if (!comment || !comment.id) {
            console.warn('Invalid comment object:', comment);
            return null;
        }
        
        return (
            <View key={comment.id} style={styles.commentContainer}>
                {/* Reply indicator for nested comments */}
                {level > 0 && (
                    <View style={styles.replyIndicator}>
                        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                        <Text style={styles.replyToText}>
                            Reply
                        </Text>
                    </View>
                )}
                
                <View style={styles.commentHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            {comment.user?.profile_picture ? (
                                <Image
                                    source={{ uri: comment.user.profile_picture }}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            )}
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{comment.user?.name || 'Unknown User'}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleBackgroundColor(comment.user?.role || 'client') }]}>
                                <Text style={[styles.roleText, { color: getRoleColor(comment.user?.role || 'client') }]}>
                                    {comment.user?.role || 'client'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.timestamp}>
                        {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown time'}
                    </Text>
                </View>

                {editingComment === comment.id ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.editInput}
                            value={editContent}
                            onChangeText={setEditContent}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleSaveEdit(comment.id)}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelEdit}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {comment.content && <Text style={styles.commentText}>{comment.content}</Text>}
                        {comment.media_url && comment.media_type && (
                            <View style={styles.mediaContainer}>
                                {renderMedia(comment.media_url, comment.media_type)}
                            </View>
                        )}
                    </>
                )}

                <View style={styles.commentActions}>
                    {/* Only show reply button for levels 0 and 1 (max 2 levels deep) */}
                    {level < 2 && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setReplyingTo(comment.id)}
                        >
                            <Text style={styles.actionButtonText}>Reply</Text>
                        </TouchableOpacity>
                    )}
                    {canEditComment(comment) && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleStartEdit(comment)}
                        >
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                    {canDeleteComment(comment) && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteComment(comment.id)}
                        >
                            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {comment.replies.map(reply => renderComment(reply, level + 1))}
                    </View>
                )}
            </View>
        );
    };

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
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Comments</Text>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefresh}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <ActivityIndicator size="small" color="#007AFF" />
                            ) : (
                                <Ionicons 
                                    name="refresh" 
                                    size={24} 
                                    color="#007AFF" 
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {programs.length > 0 && (
                    <View style={styles.programSelector}>
                        <Text style={styles.programLabel}>Select Program:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {programs.map((program) => (
                                <TouchableOpacity
                                    key={program.id}
                                    style={[
                                        styles.programButton,
                                        selectedProgramId === program.id.toString() && styles.selectedProgramButton
                                    ]}
                                    onPress={() => setSelectedProgramId(program.id.toString())}
                                >
                                    <Text style={[
                                        styles.programButtonText,
                                        selectedProgramId === program.id.toString() && styles.selectedProgramButtonText
                                    ]}>
                                        {program.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item?.id?.toString() || `comment-${Math.random()}`}
                    renderItem={({ item }) => renderComment(item)}
                    contentContainerStyle={styles.commentsList}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                        />
                    }
                />

                {/* Reply Indicator */}
                {replyingTo && (
                    <View style={styles.replyIndicatorBar}>
                        <View style={styles.replyIndicatorContent}>
                            <Ionicons name="arrow-back" size={16} color="#6B7280" />
                            <Text style={styles.replyIndicatorText}>
                                Replying to {comments.find(c => c.id === replyingTo)?.user?.name || 'comment'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.cancelReplyButton}
                            onPress={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                                setReplyMedia(null);
                            }}
                        >
                            <Text style={styles.cancelReplyText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={replyingTo ? replyContent : newComment}
                        onChangeText={replyingTo ? setReplyContent : setNewComment}
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        multiline
                        onFocus={() => {
                            // Scroll to bottom when input is focused
                            setTimeout(() => {
                                // This will be handled by the FlatList
                            }, 100);
                        }}
                    />
                    <TouchableOpacity
                        style={styles.mediaButton}
                        onPress={pickMedia}
                    >
                        <Ionicons name="camera" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sendButton, (!(replyingTo ? replyContent : newComment).trim() && !(replyingTo ? replyMedia : selectedMedia)) && styles.sendButtonDisabled]}
                        onPress={replyingTo ? handleReply : handleAddComment}
                        disabled={submitting || (!(replyingTo ? replyContent : newComment).trim() && !(replyingTo ? replyMedia : selectedMedia))}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : uploadingMedia ? (
                            <View style={{ alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <Text style={styles.uploadText}>Uploading...</Text>
                            </View>
                        ) : (
                            <Ionicons name="send" size={24} color="#007AFF" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Media Preview */}
                {(replyingTo ? replyMedia : selectedMedia) && (
                    <View style={styles.mediaPreviewContainer}>
                        <View style={styles.mediaPreview}>
                            {(replyingTo ? replyMedia : selectedMedia)?.type === 'image' ? (
                                <View style={styles.mediaPreviewVideo}>
                                    <Ionicons name="image" size={32} color="#007AFF" />
                                    <Text style={styles.mediaPreviewText}>Image Selected</Text>
                                </View>
                            ) : (
                                <View style={styles.mediaPreviewVideo}>
                                    <Ionicons name="play-circle" size={32} color="#007AFF" />
                                    <Text style={styles.mediaPreviewText}>Video Selected</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.removeMediaButton}
                            onPress={removeMedia}
                        >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </KeyboardAvoidingView>
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
    },
    commentText: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 8,
    },
    mediaContainer: {
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mediaVideo: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    editContainer: {
        marginBottom: 8,
    },
    editInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        marginBottom: 8,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#10B981',
        borderRadius: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
    },
    cancelButtonText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 14,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 16,
    },
    actionButton: {
        paddingVertical: 4,
    },
    actionButtonText: {
        color: '#3B82F6',
        fontWeight: '500',
        fontSize: 14,
    },
    replyInputContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    replyInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        minHeight: 60,
        marginBottom: 8,
    },
    replyActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    replyButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#3B82F6',
        borderRadius: 6,
    },
    replyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelReplyButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
    },
    repliesContainer: {
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 16,
    },
    mediaButton: {
        padding: 8,
        marginRight: 8,
    },
    sendButton: {
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    mediaPreviewContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    mediaPreview: {
        flex: 1,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    mediaPreviewImage: {
        width: '100%',
        height: '100%',
    },
    mediaPreviewVideo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaPreviewText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    removeMediaButton: {
        padding: 8,
        marginLeft: 8,
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
        fontSize: 16,
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    replyToText: {
        color: '#6B7280',
        fontSize: 12,
        fontStyle: 'italic',
    },
    replyIndicatorBar: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    replyIndicatorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    replyIndicatorText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    cancelReplyText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    maxDepthText: {
        color: '#6B7280',
        fontSize: 12,
        fontStyle: 'italic',
    },
    refreshButton: {
        padding: 8,
    },
    refreshingIcon: {
        opacity: 0.5,
    },
    uploadText: {
        fontSize: 10,
        color: '#007AFF',
        marginTop: 2,
    },
}); 