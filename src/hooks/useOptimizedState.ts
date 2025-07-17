import { useState, useCallback } from 'react';

export const useOptimizedState = <T>(initialState: T) => {
  const [state, setState] = useState(initialState);

  const optimizedSetState = useCallback((newState: T) => {
    if (JSON.stringify(state) === JSON.stringify(newState)) {
      return;
    }
    setState(newState);
  }, [state]);

  return [state, optimizedSetState] as const;
}; 