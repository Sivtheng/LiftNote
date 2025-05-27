import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    AppState,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { programService, progressLogService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Exercise {
    id: number;
    name: string;
    sets: number;
    reps?: number;
    time_seconds?: number;
    measurement_type: string;
    measurement_value: number;
    target_type: 'time' | 'reps';
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

type SetLog = {
    [exerciseId: number]: {
        [setIndex: number]: ExerciseLog;
    };
};

const WORKOUT_STATE_KEY = '@workout_state';
const WORKOUT_START_TIME_KEY = '@workout_start_time';
const EXERCISE_LOGS_KEY = '@exercise_logs';

export default function DailyExercisesScreen({ navigation, route }: any) {
    const [program, setProgram] = useState<Program | null>(null);
    const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
    const [currentDay, setCurrentDay] = useState<Day | null>(null);
    const [loading, setLoading] = useState(true);
    const [exerciseLogs, setExerciseLogs] = useState<SetLog>({});
    const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
    const [workoutDuration, setWorkoutDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appStateRef.current);

    useEffect(() => {
        fetchProgramData();
        loadWorkoutState();
        loadExerciseLogs();
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                loadWorkoutState();
                loadExerciseLogs();
            }
            appStateRef.current = nextAppState;
            setAppStateVisible(appStateRef.current);
        });

        return () => {
            subscription.remove();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const loadWorkoutState = async () => {
        try {
            const workoutState = await AsyncStorage.getItem(WORKOUT_STATE_KEY);
            const startTimeStr = await AsyncStorage.getItem(WORKOUT_START_TIME_KEY);
            
            if (workoutState === 'started' && startTimeStr) {
                const startTime = parseInt(startTimeStr);
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                setWorkoutDuration(elapsedTime);
                setIsWorkoutStarted(true);
                startTimer();
            }
        } catch (error) {
            console.error('Error loading workout state:', error);
        }
    };

    const loadExerciseLogs = async () => {
        try {
            const savedLogs = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
            if (savedLogs) {
                setExerciseLogs(JSON.parse(savedLogs));
            }
        } catch (error) {
            console.error('Error loading exercise logs:', error);
        }
    };

    const saveWorkoutState = async (isStarted: boolean) => {
        try {
            await AsyncStorage.setItem(WORKOUT_STATE_KEY, isStarted ? 'started' : 'stopped');
            if (isStarted) {
                await AsyncStorage.setItem(WORKOUT_START_TIME_KEY, (Date.now() - (workoutDuration * 1000)).toString());
            } else {
                await AsyncStorage.removeItem(WORKOUT_START_TIME_KEY);
            }
        } catch (error) {
            console.error('Error saving workout state:', error);
        }
    };

    const saveExerciseLogs = async (logs: SetLog) => {
        try {
            await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(logs));
        } catch (error) {
            console.error('Error saving exercise logs:', error);
        }
    };

    const startWorkout = () => {
        setIsWorkoutStarted(true);
        setWorkoutDuration(0);
        saveWorkoutState(true);
        startTimer();
    };

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setWorkoutDuration(prev => prev + 1);
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

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

    const handleLogChange = (exerciseId: number, setIndex: number, field: keyof ExerciseLog, value: string) => {
        const newLogs = {
            ...exerciseLogs,
            [exerciseId]: {
                ...exerciseLogs[exerciseId],
                [setIndex]: {
                    ...exerciseLogs[exerciseId]?.[setIndex],
                    [field]: value
                }
            }
        };
        setExerciseLogs(newLogs);
        saveExerciseLogs(newLogs);
    };

    const handleFinish = async () => {
        try {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            setIsWorkoutStarted(false);
            setWorkoutDuration(0);
            await saveWorkoutState(false);
            await AsyncStorage.removeItem(EXERCISE_LOGS_KEY);

            // Create progress log for each exercise and set
            for (const exercise of currentDay?.exercises || []) {
                const sets = exercise.pivot?.sets || exercise.sets;
                for (let setIndex = 0; setIndex < sets; setIndex++) {
                    const log = exerciseLogs[exercise.id]?.[setIndex];
                    if (log) {
                        const logData = {
                            exercise_id: exercise.id,
                            day_id: currentDay?.id,
                            week_id: currentWeek?.id,
                            weight: log.kg ? parseFloat(log.kg) : 0,
                            reps: log.reps ? parseInt(log.reps) : 0,
                            time_seconds: log.time_seconds ? parseInt(log.time_seconds) : 0,
                            rpe: log.rpe ? parseInt(log.rpe) : 0,
                            completed_at: new Date().toISOString(),
                            workout_duration: workoutDuration
                        };
                        
                        console.log('Sending log data:', logData);
                        await progressLogService.createLog(program?.id.toString() || '', logData);
                    }
                }
            }
            navigation.goBack();
        } catch (error: any) {
            console.error('Error saving progress:', error);
            console.error('Error details:', error.response?.data);
            Alert.alert(
                "Error",
                "Failed to save workout progress. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    const handleFinishPress = () => {
        Alert.alert(
            "Finish Workout",
            "Are you sure you want to finish this workout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Finish",
                    style: "destructive",
                    onPress: handleFinish
                }
            ],
            { cancelable: true }
        );
    };

    const renderExerciseInputs = (exercise: Exercise, setIndex: number) => {
        const measurementType = exercise.pivot?.measurement_type;
        const isTimeBased = exercise.pivot?.time_seconds !== null && exercise.pivot?.time_seconds !== undefined;
        const currentSetLog = exerciseLogs[exercise.id]?.[setIndex] || {};

        return (
            <View key={setIndex} style={styles.tableRow}>
                <Text style={styles.cell}>{setIndex + 1}</Text>
                <Text style={styles.cell}>
                    {(() => {
                        const formatNumber = (num: number | string) => {
                            const parsed = parseFloat(num.toString());
                            return Number.isInteger(parsed) ? parsed.toString() : parsed.toString();
                        };
                        
                        if (!exercise.pivot) return '';

                        if (measurementType === 'rpe' && isTimeBased && exercise.pivot.time_seconds !== undefined) {
                            return `RPE ${formatNumber(exercise.pivot.measurement_value)} x ${formatNumber(exercise.pivot.time_seconds)}s`;
                        }
                        
                        if (measurementType === 'kg') {
                            return `${formatNumber(exercise.pivot.measurement_value)}kg x ${formatNumber(exercise.pivot.reps || 0)}`;
                        }
                        
                        if (measurementType === 'rpe') {
                            return `RPE ${formatNumber(exercise.pivot.measurement_value)} x ${formatNumber(exercise.pivot.reps || 0)}`;
                        }
                        
                        if (isTimeBased && exercise.pivot.time_seconds !== undefined) {
                            return `${formatNumber(exercise.pivot.time_seconds)}s`;
                        }
                        
                        return `${formatNumber(exercise.pivot.measurement_value)} x ${formatNumber(exercise.pivot.reps || 0)}`;
                    })()}
                </Text>
                {measurementType === 'kg' ? (
                    <TextInput
                        style={[styles.inputCell, !isWorkoutStarted && styles.disabledInput]}
                        keyboardType="numeric"
                        value={currentSetLog.kg || ''}
                        onChangeText={(value) => handleLogChange(exercise.id, setIndex, 'kg', value)}
                        placeholder="kg"
                        secureTextEntry={false}
                        editable={isWorkoutStarted}
                    />
                ) : measurementType === 'rpe' ? (
                    <TextInput
                        style={[styles.inputCell, !isWorkoutStarted && styles.disabledInput]}
                        keyboardType="numeric"
                        value={currentSetLog.rpe || ''}
                        onChangeText={(value) => handleLogChange(exercise.id, setIndex, 'rpe', value)}
                        placeholder="RPE"
                        secureTextEntry={false}
                        editable={isWorkoutStarted}
                    />
                ) : null}
                {isTimeBased ? (
                    <TextInput
                        style={[styles.inputCell, !isWorkoutStarted && styles.disabledInput]}
                        keyboardType="numeric"
                        value={currentSetLog.time_seconds || ''}
                        onChangeText={(value) => handleLogChange(exercise.id, setIndex, 'time_seconds', value)}
                        placeholder="sec"
                        secureTextEntry={false}
                        editable={isWorkoutStarted}
                    />
                ) : (
                    <TextInput
                        style={[styles.inputCell, !isWorkoutStarted && styles.disabledInput]}
                        keyboardType="numeric"
                        value={currentSetLog.reps || ''}
                        onChangeText={(value) => handleLogChange(exercise.id, setIndex, 'reps', value)}
                        placeholder="reps"
                        secureTextEntry={false}
                        editable={isWorkoutStarted}
                    />
                )}
            </View>
        );
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    {!isWorkoutStarted ? (
                        <TouchableOpacity onPress={startWorkout} style={styles.startButton}>
                            <Text style={styles.startButtonText}>Start Workout</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleFinishPress} style={styles.finishButton}>
                            <Text style={styles.finishButtonText}>Finish</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isWorkoutStarted && (
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(workoutDuration)}</Text>
                    </View>
                )}

                <ScrollView 
                    style={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.weekTitle}>{currentWeek?.name}</Text>
                    <Text style={styles.dayTitle}>{currentDay?.name}</Text>

                    {currentDay?.exercises.map((exercise, index) => (
                        <View key={exercise.id} style={styles.exerciseContainer}>
                            <Text style={styles.exerciseTitle}>{index + 1}. {exercise.name}</Text>
                            
                            <View style={styles.tableHeader}>
                                <Text style={styles.headerCell}>Set</Text>
                                <Text style={styles.headerCell}>Target</Text>
                                <Text style={styles.headerCell}>
                                    {exercise.pivot?.measurement_type === 'kg' ? 'kg' : 
                                     exercise.pivot?.measurement_type === 'rpe' ? 'RPE' : ''}
                                </Text>
                                <Text style={styles.headerCell}>
                                    {exercise.pivot?.time_seconds !== null && exercise.pivot?.time_seconds !== undefined ? 'time' : 'reps'}
                                </Text>
                            </View>

                            {Array.from({ length: exercise.pivot?.sets || exercise.sets }).map((_, setIndex) => 
                                renderExerciseInputs(exercise, setIndex)
                            )}
                        </View>
                    ))}
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
    timerContainer: {
        backgroundColor: '#007AFF',
        padding: 10,
        alignItems: 'center',
    },
    timerText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    startButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#999',
    },
}); 