import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { FigmaTheme } from '../constants/figmaTheme';
import { useUserType } from '../contexts/UserTypeContext';
import { RootStackParamList, TabParamList } from '../types/navigation';

// Importar as telas
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ProgressScreen from '../screens/ProgressScreen-simple';
import ProfileScreen from '../screens/ProfileScreen';
import StudentsManagementScreen from '../screens/StudentsManagementScreen';
import WorkoutTimerScreen from '../screens/WorkoutTimerScreen';
import CreateWorkoutScreen from '../screens/CreateWorkoutScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Navegador de Tabs
function TabNavigator() {
  const theme = useTheme();
  const { isPersonal, isStudent } = useUserType();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'alert-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: FigmaTheme.colors.success,
        tabBarInactiveTintColor: FigmaTheme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: FigmaTheme.colors.gray800,
          borderTopColor: FigmaTheme.colors.gray700,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      
      {isPersonal ? (
        // Navegação para Personal/Academia
        <>
          <Tab.Screen 
            name="Students" 
            component={StudentsManagementScreen}
            options={{ title: 'Alunos' }}
          />
          <Tab.Screen 
            name="Exercises" 
            component={ExercisesScreen}
            options={{ title: 'Exercícios' }}
          />
          <Tab.Screen 
            name="Workouts" 
            component={WorkoutsScreen}
            options={{ title: 'Treinos' }}
          />
        </>
      ) : (
        // Navegação para Aluno
        <>
          <Tab.Screen 
            name="Exercises" 
            component={ExercisesScreen}
            options={{ title: 'Exercícios' }}
          />
          <Tab.Screen 
            name="Workouts" 
            component={WorkoutsScreen}
            options={{ title: 'Treinos' }}
          />
          <Tab.Screen 
            name="Progress" 
            component={ProgressScreen}
            options={{ title: 'Progresso' }}
          />
        </>
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Navegador Principal (Stack)
export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: FigmaTheme.colors.background,
          borderBottomColor: FigmaTheme.colors.gray700,
        },
        headerTintColor: FigmaTheme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WorkoutTimer" 
        component={WorkoutTimerScreen}
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
      <Stack.Screen 
        name="CreateWorkout" 
        component={CreateWorkoutScreen}
        options={{ 
          headerShown: true,
          title: 'Criar Treino',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: FigmaTheme.colors.background,
          },
          headerTintColor: FigmaTheme.colors.textPrimary,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          headerShown: true,
          title: 'Configurações',
          headerStyle: {
            backgroundColor: FigmaTheme.colors.background,
          },
          headerTintColor: FigmaTheme.colors.textPrimary,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          headerShown: true,
          title: 'Notificações',
          headerStyle: {
            backgroundColor: FigmaTheme.colors.background,
          },
          headerTintColor: FigmaTheme.colors.textPrimary,
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          headerShown: true,
          title: 'Ajuda & Suporte',
          headerStyle: {
            backgroundColor: FigmaTheme.colors.background,
          },
          headerTintColor: FigmaTheme.colors.textPrimary,
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          headerShown: true,
          title: 'Sobre',
          headerStyle: {
            backgroundColor: FigmaTheme.colors.background,
          },
          headerTintColor: FigmaTheme.colors.textPrimary,
        }}
      />
    </Stack.Navigator>
  );
}