import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useActivityTracking } from '../hooks/useActivityTracking';

interface ActivityTrackerWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that tracks user activity on any interaction
 * Wraps the entire app to monitor all touch events
 */
export function ActivityTrackerWrapper({ children }: ActivityTrackerWrapperProps) {
  const { recordActivity } = useActivityTracking();

  // Record activity on any touch/interaction
  const handleInteraction = () => {
    recordActivity();
  };

  return (
    <Pressable 
      style={{ flex: 1 }} 
      onPress={handleInteraction}
      onPressIn={handleInteraction}
      onLongPress={handleInteraction}
      onMoveShouldSetResponder={() => {
        handleInteraction();
        return false; // Don't capture the event
      }}
    >
      {children}
    </Pressable>
  );
}
