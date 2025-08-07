/**
 * Debug utility to detect render loops in React Native
 * Helps identify which component is causing "Maximum update depth exceeded" error
 */

import { useRef, useEffect } from 'react';

interface RenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  renderTimes: number[];
}

const renderTracker = new Map<string, RenderInfo>();

/**
 * Hook to detect excessive renders that might cause infinite loops
 * @param componentName - Name of the component being tracked
 * @param deps - Dependencies to track (optional)
 * @param maxRenders - Maximum renders allowed in timeWindow (default 50)
 * @param timeWindow - Time window in ms to check renders (default 1000ms)
 */
export function useRenderDebug(
  componentName: string,
  deps?: any[],
  maxRenders: number = 50,
  timeWindow: number = 1000
) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  
  useEffect(() => {
    const now = Date.now();
    renderCount.current++;
    renderTimes.current.push(now);
    
    // Clean old render times outside the window
    renderTimes.current = renderTimes.current.filter(
      time => now - time < timeWindow
    );
    
    // Check if we have too many renders in the time window
    if (renderTimes.current.length > maxRenders) {
      console.error(`🚨 RENDER LOOP DETECTED in ${componentName}!`);
      console.error(`Component rendered ${renderTimes.current.length} times in ${timeWindow}ms`);
      
      if (deps) {
        console.error('Dependencies:', deps);
        console.error('Check these values for changes on every render');
      }
      
      // Log stack trace to identify the source
      console.trace('Render loop stack trace:');
      
      // Alert in development
      if (__DEV__) {
        console.warn(`
          ⚠️ RENDER LOOP WARNING ⚠️
          Component: ${componentName}
          Renders: ${renderTimes.current.length} in ${timeWindow}ms
          
          Common causes:
          1. setState inside useEffect without proper dependencies
          2. Creating new objects/arrays in render that are used as dependencies
          3. Missing dependency array in useEffect
          4. Circular dependency updates
          
          Check the console for more details.
        `);
      }
    }
    
    // Update global tracker
    renderTracker.set(componentName, {
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: now,
      renderTimes: [...renderTimes.current]
    });
    
    // Log render info in development
    if (__DEV__ && renderCount.current % 10 === 0) {
      console.log(`📊 ${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  // Log dependency changes
  useEffect(() => {
    if (__DEV__ && deps) {
      console.log(`🔄 ${componentName} dependencies changed:`, deps);
    }
  }, deps);
}

/**
 * Get render statistics for all tracked components
 */
export function getRenderStats() {
  const stats: Record<string, any> = {};
  
  renderTracker.forEach((info, name) => {
    stats[name] = {
      totalRenders: info.renderCount,
      lastRender: new Date(info.lastRenderTime).toLocaleTimeString(),
      recentRenders: info.renderTimes.length,
      renderRate: info.renderTimes.length > 1 
        ? Math.round(1000 / ((info.renderTimes[info.renderTimes.length - 1] - info.renderTimes[0]) / info.renderTimes.length))
        : 0
    };
  });
  
  return stats;
}

/**
 * Hook to detect state updates that might cause loops
 */
export function useStateUpdateDebug<T>(
  stateName: string,
  value: T,
  componentName: string
) {
  const previousValue = useRef<T>(value);
  const updateCount = useRef(0);
  const lastUpdateTime = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    
    if (previousValue.current !== value) {
      updateCount.current++;
      
      // Detect rapid state updates
      if (timeSinceLastUpdate < 100 && updateCount.current > 5) {
        console.error(`🚨 RAPID STATE UPDATES in ${componentName}.${stateName}!`);
        console.error(`State updated ${updateCount.current} times rapidly`);
        console.error('Previous value:', previousValue.current);
        console.error('New value:', value);
        console.trace('State update trace:');
      }
      
      if (__DEV__) {
        console.log(`📝 ${componentName}.${stateName} updated:`, {
          from: previousValue.current,
          to: value,
          updateCount: updateCount.current,
          timeSinceLastUpdate: `${timeSinceLastUpdate}ms`
        });
      }
      
      previousValue.current = value;
      lastUpdateTime.current = now;
    }
  }, [value, stateName, componentName]);
}

/**
 * Clear all render tracking data
 */
export function clearRenderTracking() {
  renderTracker.clear();
  console.log('🧹 Render tracking cleared');
}

/**
 * Component wrapper to detect render loops
 */
export function withRenderDebug<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const DebuggedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    useRenderDebug(name, Object.values(props));
    return <Component {...props} />;
  };
  
  DebuggedComponent.displayName = `WithRenderDebug(${componentName || Component.displayName || Component.name})`;
  
  return DebuggedComponent;
}

export default {
  useRenderDebug,
  useStateUpdateDebug,
  getRenderStats,
  clearRenderTracking,
  withRenderDebug
};