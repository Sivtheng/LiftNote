import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { programService, progressLogService } from '../services/api';

interface Exercise {
    id: number;
    name: string;
    sets: number;
    reps?: number;
    time_seconds?: number;
    measurement_type: string;
    measurement_value: number;
    pivot?: {
        sets: number;
        reps?: number;
        time_seconds?: number;
        measurement_type: string;
        measurement_value: number;
    };
}

interface Day {
    id: number;
    name: string;
    exercises: Exercise[];
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

interface ExerciseLog {
    kg?: string;
    reps?: string;
    time_seconds?: string;
    rpe?: string;
}

export default function DailyExercisesScreen({ navigation, route }: any) {
    const [program, setProgram] = useState<Program | null>(null);
    const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
    const [currentDay, setCurrentDay] = useState<Day | null>(null);
    const [loading, setLoading] = useState(true);
    const [exerciseLogs, setExerciseLogs] = useState<Record<number, ExerciseLog>>({});

    useEffect(() => {
        fetchProgramData();
    }, []);

    const fetchProgramData = async () => {
        try {
            const response = await programService.getClientPrograms();
            console.log('Program response:', JSON.stringify(response, null, 2));
            
            if (response.programs && response.programs.length > 0) {
                const programData = response.programs[0];
                console.log('Selected program:', JSON.stringify(programData, null, 2));
                setProgram(programData);
                
                // Get current week (completed_weeks + 1)
                const currentWeekIndex = programData.completed_weeks;
                console.log('Current week index:', currentWeekIndex);
                
                if (programData.weeks && programData.weeks[currentWeekIndex]) {
                    const week = programData.weeks[currentWeekIndex];
                    console.log('Selected week:', JSON.stringify(week, null, 2));
                    setCurrentWeek(week);
                    
                    // Get first day of the week
                    if (week.days && week.days.length > 0) {
                        const day = week.days[0];
                        console.log('Selected day:', JSON.stringify(day, null, 2));
                        setCurrentDay(day);
                    } else {
                        console.log('No days found in week');
                    }
                } else {
                    console.log('No week found at index:', currentWeekIndex);
                }
            } else {
                console.log('No programs found in response');
            }
        } catch (error) {
            console.error('Error fetching program data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogChange = (exerciseId: number, field: keyof ExerciseLog, value: string) => {
        setExerciseLogs(prev => ({
            ...prev,
            [exerciseId]: {
                ...prev[exerciseId],
                [field]: value
            }
        }));
    };

    const handleFinish = async () => {
        try {
            // Create progress log for each exercise
            for (const exercise of currentDay?.exercises || []) {
                const log = exerciseLogs[exercise.id];
                if (log) {
                    await progressLogService.createLog(program?.id.toString() || '', {
                        exercise_id: exercise.id,
                        day_id: currentDay?.id,
                        week_id: currentWeek?.id,
                        weight: parseFloat(log.kg || '0') || 0,
                        reps: parseInt(log.reps || '0') || 0,
                        completed_at: new Date().toISOString()
                    });
                }
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error saving progress:', error);
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
                    <Text style={styles.finishButtonText}>Finish</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.weekTitle}>{currentWeek?.name}</Text>
                <Text style={styles.dayTitle}>{currentDay?.name}</Text>

                {currentDay?.exercises.map((exercise, index) => {
                    console.log('Exercise data:', {
                        id: exercise.id,
                        name: exercise.name,
                        pivot: exercise.pivot,
                        measurement_type: exercise.pivot?.measurement_type,
                        measurement_value: exercise.pivot?.measurement_value,
                        reps: exercise.pivot?.reps,
                        time_seconds: exercise.pivot?.time_seconds
                    });
                    return (
                        <View key={exercise.id} style={styles.exerciseContainer}>
                            <Text style={styles.exerciseTitle}>{index + 1}. {exercise.name}</Text>
                            
                            <View style={styles.tableHeader}>
                                <Text style={styles.headerCell}>Set</Text>
                                <Text style={styles.headerCell}>Target</Text>
                                <Text style={styles.headerCell}>kg/rpe</Text>
                                <Text style={styles.headerCell}>rep/time</Text>
                            </View>

                            {Array.from({ length: exercise.pivot?.sets || exercise.sets }).map((_, setIndex) => (
                                <View key={setIndex} style={styles.tableRow}>
                                    <Text style={styles.cell}>{setIndex + 1}</Text>
                                    <Text style={styles.cell}>
                                        {(() => {
                                            console.log('Rendering target for exercise:', {
                                                measurement_type: exercise.pivot?.measurement_type,
                                                measurement_value: exercise.pivot?.measurement_value,
                                                time_seconds: exercise.pivot?.time_seconds,
                                                reps: exercise.pivot?.reps
                                            });
                                            const formatNumber = (num: number | string) => {
                                                const parsed = parseFloat(num.toString());
                                                return Number.isInteger(parsed) ? parsed.toString() : parsed.toString();
                                            };
                                            return exercise.pivot?.measurement_type === 'rpe' && exercise.pivot?.time_seconds
                                                ? `RPE ${formatNumber(exercise.pivot.measurement_value)} x ${formatNumber(exercise.pivot.time_seconds)}s`
                                                : exercise.pivot?.measurement_type === 'kg' 
                                                    ? `${formatNumber(exercise.pivot.measurement_value)}kg x ${formatNumber(exercise.pivot.reps || 0)}`
                                                    : exercise.pivot?.measurement_type === 'rpe'
                                                        ? `RPE ${formatNumber(exercise.pivot.measurement_value)} x ${formatNumber(exercise.pivot.reps || 0)}`
                                                        : exercise.pivot?.time_seconds
                                                            ? `${formatNumber(exercise.pivot.time_seconds)}s`
                                                            : `${formatNumber(exercise.pivot?.measurement_value || 0)} x ${formatNumber(exercise.pivot?.reps || 0)}`;
                                        })()}
                                    </Text>
                                    <TextInput
                                        style={styles.inputCell}
                                        keyboardType="numeric"
                                        value={exerciseLogs[exercise.id]?.kg || exerciseLogs[exercise.id]?.rpe || ''}
                                        onChangeText={(value) => {
                                            if (exercise.pivot?.measurement_type === 'kg') {
                                                handleLogChange(exercise.id, 'kg', value);
                                            } else if (exercise.pivot?.measurement_type === 'rpe') {
                                                handleLogChange(exercise.id, 'rpe', value);
                                            }
                                        }}
                                        placeholder="0"
                                    />
                                    <TextInput
                                        style={styles.inputCell}
                                        keyboardType="numeric"
                                        value={exerciseLogs[exercise.id]?.reps || exerciseLogs[exercise.id]?.time_seconds || ''}
                                        onChangeText={(value) => {
                                            if (exercise.pivot?.measurement_type === 'kg' || exercise.pivot?.measurement_type === 'rpe') {
                                                handleLogChange(exercise.id, 'reps', value);
                                            } else if (exercise.pivot?.measurement_type === 'time') {
                                                handleLogChange(exercise.id, 'time_seconds', value);
                                            }
                                        }}
                                        placeholder="0"
                                    />
                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    finishButton: {
        padding: 5,
    },
    finishButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    weekTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    dayTitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    exerciseContainer: {
        marginBottom: 30,
    },
    exerciseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 10,
        marginBottom: 10,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cell: {
        flex: 1,
        textAlign: 'center',
    },
    inputCell: {
        flex: 0.8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 5,
        marginHorizontal: 2,
        textAlign: 'center',
        minWidth: 60,
        maxWidth: 75,
    },
}); 