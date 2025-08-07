# TreinosApp Context Engineering Guide

**Project**: React Native Fitness Tracking Application  
**Framework**: Expo with React Native  
**Focus**: Brazilian Portuguese fitness tracking with comprehensive workout management  

## Entry Point System

@CONVENTIONS.md - Coding standards and architectural patterns  
@EXAMPLES.md - Comprehensive code examples and templates  
@IMPLEMENTATION.md - Feature blueprints and implementation guides  
@VALIDATION.md - Quality gates and testing standards  

## Project Overview

TreinosApp is a React Native fitness tracking application designed for Brazilian users, featuring:

- **Workout Management**: Create, edit, duplicate, delete and track workout routines
- **Exercise Library**: Comprehensive database of exercises with categories and search
- **Progress Tracking**: Visual charts and statistics for fitness progress
- **User Authentication**: Login/signup with dual user types (Personal/Student)
- **Timer System**: Complete workout execution with rest timers and notifications
- **Profile Management**: Editable personal information and app settings
- **Student Management**: Personal trainers can manage their students
- **Localization**: Portuguese language interface with Brazilian cultural context

## Core Architecture Principles

### 1. Mobile-First Design
- Touch-optimized interfaces with 44pt minimum touch targets
- Responsive layouts for various screen sizes (phones/tablets)
- Performance optimization for lower-end devices
- Offline-first approach with data synchronization

### 2. React Native Best Practices
- Functional components with hooks (no class components)
- Proper navigation hierarchy with React Navigation
- Consistent state management patterns
- Performance optimization with proper memoization

### 3. Fitness Domain Focus
- Brazilian Portuguese terminology for exercises and body parts
- Metric system (kg, cm) as primary measurement
- Local fitness culture and exercise preferences
- Accessibility for users with varying fitness levels

### 4. Data Architecture
- Local-first with AsyncStorage for offline capability
- Structured data models for workouts, exercises, and progress
- Efficient data relationships and normalization
- Export/import capabilities for data portability

## Technology Stack

### Core Framework
```yaml
platform: React Native (Expo managed workflow)
navigation: React Navigation v7 (Bottom Tabs + Stack)
ui_library: React Native Paper (Material Design)
state_management: React Hooks + Context API
storage: AsyncStorage for persistence
```

### Key Dependencies
```yaml
charts: react-native-chart-kit (progress visualization)
icons: @expo/vector-icons (Ionicons)
gestures: react-native-gesture-handler
animations: react-native-reanimated
safe_area: react-native-safe-area-context
```

## Development Standards

### File Structure
```
/screens/          - Screen components (one per file)
/components/       - Reusable UI components
/navigation/       - Navigation configuration
/services/         - Data services and API integration
/hooks/           - Custom React hooks
/utils/           - Utility functions and helpers
/constants/       - App constants and configuration
/types/           - TypeScript type definitions
/assets/          - Images, fonts, and static resources
```

### Component Standards
- One component per file with default export
- Props interface defined above component
- Consistent naming: PascalCase for components, camelCase for functions
- StyleSheet definitions at bottom of file
- Portuguese comments for business logic, English for technical

### Screen Standards
- Each screen in separate file under `/screens/`
- Screen-specific styles defined in same file
- Loading states and error handling implemented
- Navigation prop typing for TypeScript safety

## Implementation Priorities

### Phase 1: Core Foundation
1. **Authentication System**: Login/signup with basic validation
2. **Navigation Structure**: Tab navigator with all main screens
3. **Basic UI Components**: Cards, forms, buttons with consistent styling
4. **Data Models**: Exercise, Workout, User profile structures

### Phase 2: Core Features
1. **Exercise Library**: Browse and search exercises by category
2. **Workout Creation**: Build custom workout routines
3. **Workout Execution**: Timer-based workout sessions
4. **Basic Progress**: Simple statistics and history

### Phase 3: Advanced Features
1. **Progress Analytics**: Charts and detailed statistics
2. **Workout Templates**: Pre-built workout programs
3. **Social Features**: Sharing workouts and progress
4. **Advanced Settings**: Customization and preferences

## Quality Assurance

### Performance Requirements
- App launch time: <3 seconds on mid-range devices
- Screen transitions: <300ms with smooth animations
- Memory usage: <150MB for main app functionality
- Bundle size: <50MB for initial download

### User Experience Standards
- All text in Brazilian Portuguese with proper grammar
- Touch targets minimum 44pt with adequate spacing
- Consistent color scheme and typography
- Accessibility support for screen readers
- Intuitive navigation patterns

### Code Quality Gates
- No unused imports or variables
- Consistent code formatting (Prettier configuration)
- Proper error handling for all user interactions
- Loading states for all async operations
- Input validation with user-friendly error messages

## Localization Context

### Language Requirements
- All user-facing text in Brazilian Portuguese
- Exercise names using common Brazilian gym terminology
- Date/time formatting according to Brazilian standards (DD/MM/YYYY)
- Number formatting with comma as decimal separator

### Cultural Considerations
- Exercise categories reflect Brazilian gym culture
- Measurement units in metric system (kg, cm, km)
- Common workout splits popular in Brazil
- Motivational language appropriate for Brazilian audience

## Error Prevention Rules

### Common Pitfalls to Avoid
1. **Navigation Issues**: Always use proper navigation prop typing
2. **State Mutations**: Never mutate state directly, use proper setState patterns
3. **Memory Leaks**: Clean up listeners and subscriptions in useEffect cleanup
4. **Performance**: Avoid inline functions in render loops
5. **Styling**: Use consistent spacing and color values from theme

### Required Validations
1. **User Input**: All form inputs must have validation and error states
2. **Data Persistence**: Always handle AsyncStorage errors gracefully
3. **Network Requests**: Implement proper loading states and error handling
4. **Type Safety**: Use TypeScript for all new code with proper typing

### Mandatory Implementations
1. **Loading States**: Every async operation needs loading indicator
2. **Error Boundaries**: Catch and handle component errors gracefully
3. **Accessibility**: Proper labels and hints for screen readers
4. **Performance**: Memoization for expensive calculations or renders

## Success Metrics

### Technical Metrics
- Zero critical bugs in production
- 95%+ test coverage for core features
- Bundle size optimization (target <50MB)
- Performance benchmarks met consistently

### User Experience Metrics
- Intuitive navigation (minimal user confusion)
- Fast loading times across all screens
- Consistent visual design following Material Design
- Proper Portuguese localization throughout

## AI Implementation Guidelines

When implementing features for TreinosApp:

1. **Context Awareness**: Always consider Brazilian fitness culture and terminology
2. **User-Centric**: Prioritize user experience over technical complexity
3. **Performance First**: Mobile performance considerations in all decisions
4. **Consistency**: Follow established patterns and conventions
5. **Quality Gates**: Implement proper validation and error handling
6. **Documentation**: Comment business logic in Portuguese, technical in English

---

*This document serves as the primary context for all AI assistants working on TreinosApp. Reference the linked documents for specific implementation details and examples.*

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
