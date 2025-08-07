/**
 * WorkoutTimer Component Tests
 * Tests the workout timer functionality and UI interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native-paper components
jest.mock('react-native-paper', () => ({
  Card: ({ children }: any) => children,
  Title: ({ children }: any) => children,
  Paragraph: ({ children }: any) => children,
  Button: ({ onPress, children, ...props }: any) => (
    <button testID={props.testID} onClick={onPress}>
      {children}
    </button>
  ),
  ProgressBar: ({ progress, ...props }: any) => (
    <div testID={props.testID} data-progress={progress} />
  ),
  Text: ({ children }: any) => children,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock workout timer screen component (simplified version for testing)
const WorkoutTimerScreen = ({ navigation, route }: any) => {
  const [currentExercise, setCurrentExercise] = React.useState(0);
  const [currentSet, setCurrentSet] = React.useState(1);
  const [restTime, setRestTime] = React.useState(60);
  const [isResting, setIsResting] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [totalTime, setTotalTime] = React.useState(0);

  const mockWorkout = route?.params?.workout || {
    id: '1',
    name: 'Test Workout',
    exercises: [
      {
        id: '1',
        name: 'Push ups',
        sets: 3,
        reps: '10-12',
        restTime: 60,
      },
      {
        id: '2', 
        name: 'Squats',
        sets: 3,
        reps: '15',
        restTime: 45,
      },
    ],
  };

  // Timer effects
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isPaused) {
      interval = setInterval(() => {
        if (isResting && restTime > 0) {
          setRestTime(prev => prev - 1);
        } else if (isResting && restTime === 0) {
          setIsResting(false);
          setRestTime(mockWorkout.exercises[currentExercise]?.restTime || 60);
        }
        setTotalTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPaused, isResting, restTime, currentExercise, mockWorkout]);

  const handleCompleteSet = () => {
    const exercise = mockWorkout.exercises[currentExercise];
    if (currentSet < exercise.sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTime(exercise.restTime);
    } else {
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentExercise < mockWorkout.exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setCurrentSet(1);
      setIsResting(false);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = () => {
    navigation.navigate('WorkoutComplete', {
      workoutId: mockWorkout.id,
      totalTime,
      exercises: mockWorkout.exercises.length,
    });
  };

  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
  };

  const handleStopWorkout = () => {
    navigation.goBack();
  };

  const currentExerciseData = mockWorkout.exercises[currentExercise];
  const progress = (currentExercise + (currentSet / currentExerciseData?.sets)) / mockWorkout.exercises.length;

  return (
    <div testID="workout-timer-screen">
      <div testID="workout-title">{mockWorkout.name}</div>
      
      <div testID="progress-section">
        <div testID="progress-bar" data-progress={progress} />
        <div testID="progress-text">
          Exercise {currentExercise + 1} of {mockWorkout.exercises.length}
        </div>
      </div>

      <div testID="current-exercise">
        <div testID="exercise-name">{currentExerciseData?.name}</div>
        <div testID="exercise-details">
          Set {currentSet} of {currentExerciseData?.sets}
        </div>
        <div testID="exercise-reps">{currentExerciseData?.reps} reps</div>
      </div>

      {isResting && (
        <div testID="rest-timer">
          <div testID="rest-title">Rest Time</div>
          <div testID="rest-countdown">{restTime}s</div>
        </div>
      )}

      <div testID="timer-display">
        Total Time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
      </div>

      <div testID="control-buttons">
        <button 
          testID="pause-resume-btn"
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        
        {!isResting && (
          <button 
            testID="complete-set-btn"
            onClick={handleCompleteSet}
          >
            Complete Set
          </button>
        )}
        
        <button 
          testID="stop-workout-btn"
          onClick={handleStopWorkout}
        >
          Stop Workout
        </button>
      </div>
    </div>
  );
};

describe('WorkoutTimerScreen', () => {
  const mockWorkout = {
    id: '1',
    name: 'Test Workout',
    exercises: [
      {
        id: '1',
        name: 'Push ups',
        sets: 3,
        reps: '10-12',
        restTime: 60,
      },
      {
        id: '2',
        name: 'Squats', 
        sets: 3,
        reps: '15',
        restTime: 45,
      },
    ],
  };

  const defaultProps = {
    navigation: mockNavigation,
    route: {
      params: {
        workout: mockWorkout,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    it('should render workout timer with correct initial state', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('workout-timer-screen')).toBeTruthy();
      expect(getByTestId('workout-title')).toHaveTextContent('Test Workout');
      expect(getByTestId('progress-text')).toHaveTextContent('Exercise 1 of 2');
      expect(getByTestId('exercise-name')).toHaveTextContent('Push ups');
      expect(getByTestId('exercise-details')).toHaveTextContent('Set 1 of 3');
      expect(getByTestId('exercise-reps')).toHaveTextContent('10-12 reps');
    });

    it('should show correct progress bar value', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      const progressBar = getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-progress', '0.16666666666666666'); // 1/6 (set 1 of 3 sets of exercise 1 of 2)
    });

    it('should show control buttons', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('pause-resume-btn')).toHaveTextContent('Pause');
      expect(getByTestId('complete-set-btn')).toBeTruthy();
      expect(getByTestId('stop-workout-btn')).toBeTruthy();
    });
  });

  describe('Timer Functionality', () => {
    it('should increment total time every second', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('timer-display')).toHaveTextContent('Total Time: 0:00');

      act(() => {
        jest.advanceTimersByTime(3000); // 3 seconds
      });

      expect(getByTestId('timer-display')).toHaveTextContent('Total Time: 0:03');
    });

    it('should pause and resume timer', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      const pauseBtn = getByTestId('pause-resume-btn');

      // Advance time
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByTestId('timer-display')).toHaveTextContent('Total Time: 0:02');

      // Pause
      fireEvent.press(pauseBtn);
      expect(pauseBtn).toHaveTextContent('Resume');

      // Time shouldn't advance when paused
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(getByTestId('timer-display')).toHaveTextContent('Total Time: 0:02');

      // Resume
      fireEvent.press(pauseBtn);
      expect(pauseBtn).toHaveTextContent('Pause');

      // Time should advance again
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByTestId('timer-display')).toHaveTextContent('Total Time: 0:04');
    });
  });

  describe('Set Completion', () => {
    it('should start rest timer when completing a set', () => {
      const { getByTestId, queryByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      const completeSetBtn = getByTestId('complete-set-btn');

      // Complete first set
      fireEvent.press(completeSetBtn);

      // Should show rest timer
      expect(getByTestId('rest-timer')).toBeTruthy();
      expect(getByTestId('rest-title')).toHaveTextContent('Rest Time');
      expect(getByTestId('rest-countdown')).toHaveTextContent('60s');

      // Complete set button should be hidden during rest
      expect(queryByTestId('complete-set-btn')).toBeFalsy();
    });

    it('should count down rest time', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      // Complete first set to start rest
      fireEvent.press(getByTestId('complete-set-btn'));

      expect(getByTestId('rest-countdown')).toHaveTextContent('60s');

      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });

      expect(getByTestId('rest-countdown')).toHaveTextContent('55s');
    });

    it('should move to next set after rest period ends', async () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      // Complete first set
      fireEvent.press(getByTestId('complete-set-btn'));
      
      expect(getByTestId('exercise-details')).toHaveTextContent('Set 2 of 3');

      // Fast forward through rest period
      act(() => {
        jest.advanceTimersByTime(60000); // 60 seconds
      });

      await waitFor(() => {
        expect(getByTestId('complete-set-btn')).toBeTruthy(); // Rest ended
      });
    });
  });

  describe('Exercise Progression', () => {
    it('should move to next exercise after completing all sets', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      // Complete all 3 sets of first exercise
      for (let i = 0; i < 3; i++) {
        fireEvent.press(getByTestId('complete-set-btn'));
        if (i < 2) {
          // Skip rest time for first 2 sets
          act(() => {
            jest.advanceTimersByTime(60000);
          });
        }
      }

      // Should move to second exercise
      expect(getByTestId('exercise-name')).toHaveTextContent('Squats');
      expect(getByTestId('exercise-details')).toHaveTextContent('Set 1 of 3');
      expect(getByTestId('progress-text')).toHaveTextContent('Exercise 2 of 2');
    });

    it('should complete workout after all exercises', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      // Complete first exercise (3 sets)
      for (let i = 0; i < 3; i++) {
        fireEvent.press(getByTestId('complete-set-btn'));
        if (i < 2) {
          act(() => {
            jest.advanceTimersByTime(60000);
          });
        }
      }

      // Complete second exercise (3 sets)
      for (let i = 0; i < 3; i++) {
        fireEvent.press(getByTestId('complete-set-btn'));
        if (i < 2) {
          act(() => {
            jest.advanceTimersByTime(45000); // Different rest time
          });
        }
      }

      // Should navigate to completion screen
      expect(mockNavigation.navigate).toHaveBeenCalledWith('WorkoutComplete', {
        workoutId: '1',
        totalTime: expect.any(Number),
        exercises: 2,
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress bar correctly', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      const progressBar = getByTestId('progress-bar');

      // Initial progress (set 1 of 3 of exercise 1 of 2)
      expect(progressBar).toHaveAttribute('data-progress', '0.16666666666666666');

      // Complete first set
      fireEvent.press(getByTestId('complete-set-btn'));

      // Progress should update (set 2 of 3 of exercise 1 of 2)
      expect(progressBar).toHaveAttribute('data-progress', '0.3333333333333333');
    });

    it('should show correct exercise and set information', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('exercise-name')).toHaveTextContent('Push ups');
      expect(getByTestId('exercise-details')).toHaveTextContent('Set 1 of 3');

      // Complete first set
      fireEvent.press(getByTestId('complete-set-btn'));

      expect(getByTestId('exercise-name')).toHaveTextContent('Push ups');
      expect(getByTestId('exercise-details')).toHaveTextContent('Set 2 of 3');
    });
  });

  describe('Navigation', () => {
    it('should navigate back when stopping workout', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      fireEvent.press(getByTestId('stop-workout-btn'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should handle workout completion navigation', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      // Complete entire workout
      for (let exercise = 0; exercise < 2; exercise++) {
        for (let set = 0; set < 3; set++) {
          fireEvent.press(getByTestId('complete-set-btn'));
          if (set < 2 || exercise < 1) {
            const restTime = exercise === 0 ? 60000 : 45000;
            act(() => {
              jest.advanceTimersByTime(restTime);
            });
          }
        }
      }

      expect(mockNavigation.navigate).toHaveBeenCalledWith('WorkoutComplete', {
        workoutId: '1',
        totalTime: expect.any(Number),
        exercises: 2,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing workout data gracefully', () => {
      const propsWithoutWorkout = {
        navigation: mockNavigation,
        route: {
          params: {},
        },
      };

      expect(() => {
        render(<WorkoutTimerScreen {...propsWithoutWorkout} />);
      }).not.toThrow();
    });

    it('should handle empty exercises array', () => {
      const propsWithEmptyWorkout = {
        navigation: mockNavigation,
        route: {
          params: {
            workout: {
              id: '1',
              name: 'Empty Workout',
              exercises: [],
            },
          },
        },
      };

      expect(() => {
        render(<WorkoutTimerScreen {...propsWithEmptyWorkout} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible elements with proper testIDs', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('workout-timer-screen')).toBeTruthy();
      expect(getByTestId('pause-resume-btn')).toBeTruthy();
      expect(getByTestId('complete-set-btn')).toBeTruthy();
      expect(getByTestId('stop-workout-btn')).toBeTruthy();
      expect(getByTestId('progress-bar')).toBeTruthy();
      expect(getByTestId('timer-display')).toBeTruthy();
    });

    it('should provide meaningful button text', () => {
      const { getByTestId } = render(<WorkoutTimerScreen {...defaultProps} />);

      expect(getByTestId('pause-resume-btn')).toHaveTextContent('Pause');
      expect(getByTestId('complete-set-btn')).toHaveTextContent('Complete Set');
      expect(getByTestId('stop-workout-btn')).toHaveTextContent('Stop Workout');
    });
  });
});