import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { programService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface ProgressLog {
    id: number;
    exercise: {
        name: string;
    };
    weight: number;
    reps: number;
    time_seconds: number;
    rpe: number;
    completed_at: string;
    workout_duration: number;
    is_rest_day: boolean;
}

interface Day {
    id: number;
    name: string;
    progress_logs: ProgressLog[];
}

interface Week {
    id: number;
    name: string;
    days: Day[];
}

interface Program {
    id: number;
    title: string;
    weeks: Week[];
}

export default function HistoryScreen({ navigation }: any) {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchPrograms();
        }, [])
    );

    const fetchPrograms = async () => {
        try {
            const response = await programService.getClientPrograms();
            if (response.programs) {
                setPrograms(response.programs);
                if (response.programs.length > 0) {
                    setSelectedProgram(response.programs[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const renderDayDetails = (day: Day) => {
        const totalDuration = day.progress_logs?.reduce((sum, log) => sum + (log.workout_duration || 0), 0) || 0;
        const completionDate = day.progress_logs?.[0]?.completed_at;

        return (
            <Modal
                visible={selectedDay !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDay(null)}
            >
                <TouchableOpacity 
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPress={() => setSelectedDay(null)}
                >
                    <TouchableOpacity 
                        activeOpacity={1} 
                        onPress={(e) => e.stopPropagation()}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{day.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedDay(null)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryTitle}>Workout Summary</Text>
                            <Text style={styles.summaryText}>
                                Completed: {completionDate ? formatDate(completionDate) : 'Not completed yet'}
                            </Text>
                            {totalDuration > 0 && (
                                <Text style={styles.summaryText}>
                                    Total Duration: {formatDuration(totalDuration)}
                                </Text>
                            )}
                        </View>

                        <ScrollView style={styles.exercisesList}>
                            {day.progress_logs?.map((log) => (
                                <View key={log.id} style={styles.exerciseLog}>
                                    <Text style={styles.exerciseName}>
                                        {log.is_rest_day ? 'Rest Day' : log.exercise?.name || 'Unknown Exercise'}
                                    </Text>
                                    <View style={styles.exerciseDetails}>
                                        {!log.is_rest_day && log.weight && (
                                            <Text style={styles.exerciseDetail}>Weight: {log.weight}kg</Text>
                                        )}
                                        {!log.is_rest_day && log.reps && (
                                            <Text style={styles.exerciseDetail}>Reps: {log.reps}</Text>
                                        )}
                                        {!log.is_rest_day && log.time_seconds && (
                                            <Text style={styles.exerciseDetail}>Time: {formatDuration(log.time_seconds)}</Text>
                                        )}
                                        {!log.is_rest_day && log.rpe && (
                                            <Text style={styles.exerciseDetail}>RPE: {log.rpe}</Text>
                                        )}
                                    </View>
                                </View>
                            )) || (
                                <Text style={styles.emptyText}>No exercises completed for this day</Text>
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    if (programs.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Workout History</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No programs available</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Workout History</Text>
            </View>

            <View style={styles.programSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {programs.map((program) => (
                        <TouchableOpacity
                            key={program.id}
                            style={[
                                styles.programButton,
                                selectedProgram?.id === program.id && styles.selectedProgramButton
                            ]}
                            onPress={() => setSelectedProgram(program)}
                        >
                            <Text style={[
                                styles.programButtonText,
                                selectedProgram?.id === program.id && styles.selectedProgramButtonText
                            ]}>
                                {program.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {selectedProgram?.weeks?.map((week) => (
                    <View key={week.id} style={styles.weekContainer}>
                        <Text style={styles.weekTitle}>{week.name}</Text>
                        {week.days?.map((day) => (
                            <TouchableOpacity
                                key={day.id}
                                style={styles.dayButton}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={styles.dayButtonText}>{day.name}</Text>
                                {day.progress_logs?.length > 0 && (
                                    <Text style={styles.completedText}>
                                        Completed {formatDate(day.progress_logs[0].completed_at)}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>

            {selectedDay && renderDayDetails(selectedDay)}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    programSelector: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    programButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    selectedProgramButton: {
        backgroundColor: '#007AFF',
    },
    programButtonText: {
        color: '#333',
        fontWeight: '500',
    },
    selectedProgramButtonText: {
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    weekContainer: {
        marginBottom: 30,
    },
    weekTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    dayButton: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
    },
    dayButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    completedText: {
        fontSize: 12,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryContainer: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    exercisesList: {
        maxHeight: '60%',
    },
    exerciseLog: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    exerciseDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    exerciseDetail: {
        fontSize: 14,
        color: '#444',
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
}); 