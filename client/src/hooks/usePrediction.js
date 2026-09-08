/**
 * usePrediction.js — Hook for fetching storm predictions
 */

import { useCallback, useEffect } from 'react';
import useStormStore from '../store/stormStore';
import { getPrediction } from '../services/api';

/**
 * Fetches and caches the prediction for a given storm ID.
 * @param {string|null} stormId
 */
export function usePrediction(stormId) {
  const { predictions, updatePrediction } = useStormStore();

  const prediction = stormId ? predictions[stormId] ?? null : null;

  const fetchPrediction = useCallback(async () => {
    if (!stormId) return;
    try {
      const data = await getPrediction(stormId);
      if (data) updatePrediction(stormId, data);
    } catch (err) {
      console.error(`[usePrediction] Failed for ${stormId}:`, err.message);
    }
  }, [stormId, updatePrediction]);

  useEffect(() => {
    if (stormId) fetchPrediction();
  }, [stormId, fetchPrediction]);

  return { prediction, fetchPrediction };
}

export default usePrediction;
