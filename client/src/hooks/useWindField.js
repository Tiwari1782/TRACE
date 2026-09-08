/**
 * useWindField.js — Hook for fetching wind field grid data
 */

import { useEffect, useCallback } from 'react';
import useStormStore from '../store/stormStore';
import { getWindField } from '../services/api';

export function useWindField() {
  const { windField, setWindField } = useStormStore();

  const fetchWindField = useCallback(async () => {
    try {
      const data = await getWindField();
      setWindField(Array.isArray(data) ? data : data?.points ?? []);
    } catch (err) {
      console.error('[useWindField] Failed to fetch wind field:', err.message);
    }
  }, [setWindField]);

  useEffect(() => {
    fetchWindField();
  }, [fetchWindField]);

  return { windField, fetchWindField };
}

export default useWindField;
