import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Tipos para navegação principal
export type RootStackParamList = {
  MainTabs: undefined;
  WorkoutTimer: { workout: any };
  CreateWorkout: undefined;
  Settings: undefined;
  Notifications: undefined;
  Help: undefined;
  About: undefined;
};

// Tipos para navegação de autenticação
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  UserTypeSelection: undefined;
  MainApp: undefined;
};

// Tipos para navegação de tabs
export type TabParamList = {
  Home: undefined;
  Exercises: undefined;
  Workouts: undefined;
  Students: undefined;
  Progress: undefined;
  Profile: undefined;
};

// Props de navegação para cada tela
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type TabNavigationProp = StackNavigationProp<TabParamList>;

// Tipo composto para navegação de telas dentro de tabs
export type WorkoutsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Workouts'>,
  StackNavigationProp<RootStackParamList>
>; 