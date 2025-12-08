import { useEffect, useState } from 'react';
import type { LoadState, VDemRow } from '../types';

const DATA_URL = '/data/vdem-lite.json';

export function useVdemData(): LoadState {
  const [state, setState] = useState<LoadState>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetch(DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load data (${response.status})`);
        }
        const json = (await response.json()) as VDemRow[];
        setState({ data: json, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, []);

  return state;
}
