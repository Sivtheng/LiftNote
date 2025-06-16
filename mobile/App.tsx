import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DailyExercisesScreen from './src/screens/DailyExercisesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CommentsScreen from './src/screens/CommentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type TabParamList = {
    Home: undefined;
    History: undefined;
    Settings: undefined;
    Comments: undefined;
};

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'History') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'Comments') {
                        iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                    } else {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Comments" component={CommentsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
                <Stack.Screen name="MainApp" component={TabNavigator} />
                <Stack.Screen name="DailyExercises" component={DailyExercisesScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
