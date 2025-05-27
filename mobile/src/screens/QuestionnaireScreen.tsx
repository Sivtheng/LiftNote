import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { questionnaireService } from '../services/api';

interface Question {
    key: string;
    question: string;
}

export default function QuestionnaireScreen({ navigation }: any) {
    const [questions, setQuestions] = useState<Record<string, string>>({});
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const response = await questionnaireService.getQuestions();
            setQuestions(response.questions);
            // Initialize answers object with empty strings
            const initialAnswers = Object.keys(response.questions).reduce((acc, key) => {
                acc[key] = '';
                return acc;
            }, {} as Record<string, string>);
            setAnswers(initialAnswers);
        } catch (error) {
            Alert.alert('Error', 'Failed to load questionnaire');
            console.error('Error loading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        const unansweredQuestions = Object.entries(answers).filter(([_, value]) => !value.trim());
        if (unansweredQuestions.length > 0) {
            Alert.alert('Error', 'Please answer all questions');
            return;
        }

        try {
            setSubmitting(true);
            await questionnaireService.submitAnswers(answers);
            // Navigate to main app after successful submission
            navigation.replace('MainApp');
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to submit questionnaire'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView 
                    style={styles.scrollView}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>Initial Assessment</Text>
                        <Text style={styles.subtitle}>
                            Please answer these questions to help us understand your fitness goals and needs.
                        </Text>

                        {Object.entries(questions).map(([key, question]) => (
                            <View key={key} style={styles.questionContainer}>
                                <Text style={styles.questionText}>{question}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={answers[key]}
                                    onChangeText={(text) => setAnswers({ ...answers, [key]: text })}
                                    placeholder="Your answer"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40, // Add extra padding at the bottom
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    questionContainer: {
        marginBottom: 20,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 