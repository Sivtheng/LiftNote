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
    Linking,
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
    video_link?: string;
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
    current_week?: Week;
    current_day?: Day;
    status?: string;
    completed_weeks?: number;
    total_weeks?: number;
    client_id?: number;
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
    const { programId } = route.params || {};
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
    }, [programId]);

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

    const openVideoLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open this video link');
            }
        } catch (error) {
            console.error('Error opening video link:', error);
            Alert.alert('Error', 'Failed to open video link');
        }
    };

    const fetchProgramData = async () => {
        try {
            const response = await programService.getClientPrograms();
            
            if (response.programs && response.programs.length > 0) {
                // Find the specific program by ID if provided, otherwise use the first one
                let programData;
                if (programId) {
                    programData = response.programs.find((p: Program) => p.id.toString() === programId);
                    if (!programData) {
                        console.error('Program not found with ID:', programId);
                        setLoading(false);
                        return;
                    }
                } else {
                    programData = response.programs[0];
                }
                
                setProgram(programData);
                
                // Get current week and day from the program
                if (programData.current_week && programData.current_day) {
                    setCurrentWeek(programData.current_week);
                    setCurrentDay(programData.current_day);
                }
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

    const checkIncompleteExercises = () => {
        const incompleteExercises = [];
        for (const exercise of currentDay?.exercises || []) {
            const sets = exercise.pivot?.sets || exercise.sets;
            for (let setIndex = 0; setIndex < sets; setIndex++) {
                const log = exerciseLogs[exercise.id]?.[setIndex];
                if (!log || !Object.values(log).some(value => value !== '')) {
                    incompleteExercises.push(exercise.name);
                    break;
                }
            }
        }
        return incompleteExercises;
    };

    const isProgramCompleted = (): boolean => {
        if (!program) return false;
        return program.status === 'completed' || 
               (program.completed_weeks !== undefined && program.total_weeks !== undefined && 
                program.completed_weeks >= program.total_weeks);
    };

    const refreshProgramData = async () => {
        try {
            const response = await programService.getClientPrograms();
            
            if (response.programs && response.programs.length > 0) {
                // Find the specific program by ID if provided, otherwise use the first one
                let programData;
                if (programId) {
                    programData = response.programs.find((p: Program) => p.id.toString() === programId);
                    if (!programData) {
                        console.error('Program not found with ID:', programId);
                        return;
                    }
                } else {
                    programData = response.programs[0];
                }
                
                setProgram(programData);
                
                // Get current week and day from the program
                if (programData.current_week && programData.current_day) {
                    setCurrentWeek(programData.current_week);
                    setCurrentDay(programData.current_day);
                }
            }
        } catch (error) {
            console.error('Error refreshing program data:', error);
        }
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

            // If it's a rest day (no exercises), create a single rest day log
            if (!currentDay?.exercises || currentDay.exercises.length === 0) {
                const restDayLog = {
                    day_id: currentDay?.id,
                    week_id: currentWeek?.id,
                    weight: 0,
                    reps: 0,
                    time_seconds: 0,
                    rpe: null,
                    completed_at: new Date().toISOString(),
                    workout_duration: 0,
                    is_rest_day: true
                };
                
                await progressLogService.createLog(program?.id.toString() || '', restDayLog);
            } else {
                // Create progress log for each exercise and set
                for (const exercise of currentDay?.exercises || []) {
                    const sets = exercise.pivot?.sets || exercise.sets;
                    for (let setIndex = 0; setIndex < sets; setIndex++) {
                        const log = exerciseLogs[exercise.id]?.[setIndex];
                        const logData = {
                            exercise_id: exercise.id,
                            day_id: currentDay?.id,
                            week_id: currentWeek?.id,
                            weight: log?.kg ? parseFloat(log.kg) : 0,
                            reps: log?.reps ? parseInt(log.reps) : 0,
                            time_seconds: log?.time_seconds ? parseInt(log.time_seconds) : 0,
                            rpe: log?.rpe ? parseInt(log.rpe) : null,
                            completed_at: new Date().toISOString(),
                            workout_duration: workoutDuration
                        };
                        
                        await progressLogService.createLog(program?.id.toString() || '', logData);
                    }
                }
            }

            // Check if this might be the last day of the week and try to mark week as complete
            if (currentWeek) {
                try {
                    await programService.markWeekComplete(program?.id.toString() || '', currentWeek.id.toString());
                    // Refresh program data to get updated completion status
                    await refreshProgramData();
                } catch (error: any) {
                    // If it's "Week already completed", that's fine - still refresh data
                    if (error.response?.data?.message === 'Week already completed') {
                        await refreshProgramData();
                    } else {
                        // If it fails for other reasons (e.g., not the next week in sequence), that's okay
                        console.log('Week not ready to be marked complete yet:', error);
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
        const incompleteExercises = checkIncompleteExercises();
        
        if (incompleteExercises.length > 0) {
            Alert.alert(
                "Incomplete Workout",
                `You have ${incompleteExercises.length} incomplete exercise${incompleteExercises.length > 1 ? 's' : ''}: ${incompleteExercises.join(', ')}.\n\nWould you like to skip the remaining sets?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Skip Remaining",
                        style: "destructive",
                        onPress: handleFinish
                    }
                ],
                { cancelable: true }
            );
        } else {
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
        }
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
                ) : (
                    <View style={styles.inputCell} />
                )}
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
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </SafeAreaView>
        );
    }

    if (!program || !currentWeek || !currentDay) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="fitness-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No program assigned</Text>
                    <Text style={[styles.emptyText, { fontSize: 14, marginTop: 10 }]}>
                        Contact your coach to get assigned a workout program
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentDay.exercises || currentDay.exercises.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daily Exercises</Text>
                </View>
                <View style={styles.restDayContainer}>
                    <Ionicons name="bed-outline" size={80} color="#007AFF" style={styles.restIcon} />
                    <Text style={styles.restDayTitle}>Rest Day</Text>
                    <Text style={styles.restDayText}>Today is a rest day. Take time to recover and prepare for your next workout.</Text>
                    <TouchableOpacity 
                        style={styles.doneRestingButton}
                        onPress={handleFinishPress}
                    >
                        <Text style={styles.doneRestingButtonText}>Done Resting</Text>
                    </TouchableOpacity>
                </View>
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
                        <TouchableOpacity 
                            onPress={startWorkout} 
                            style={[
                                styles.startButton,
                                isProgramCompleted() && styles.disabledButton
                            ]}
                            disabled={isProgramCompleted()}
                        >
                            <Text style={[
                                styles.startButtonText,
                                isProgramCompleted() && styles.disabledButtonText
                            ]}>
                                {isProgramCompleted() ? 'Program Completed' : 'Start Workout'}
                            </Text>
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
                            <View style={styles.exerciseHeader}>
                                <Text style={styles.exerciseTitle}>{index + 1}. {exercise.name}</Text>
                                {exercise.video_link && (
                                    <TouchableOpacity 
                                        style={styles.videoButton}
                                        onPress={() => openVideoLink(exercise.video_link!)}
                                    >
                                        <Ionicons name="play-circle-outline" size={24} color="#007AFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            
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
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    exerciseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    videoButton: {
        padding: 5,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    restDayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    restIcon: {
        marginBottom: 20,
    },
    restDayTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#007AFF',
    },
    restDayText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    doneRestingButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    doneRestingButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    disabledButtonText: {
        color: '#666',
    },
}); 