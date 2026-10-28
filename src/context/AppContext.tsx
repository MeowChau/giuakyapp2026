import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AppData, BookingDraft, FieldDraft } from '../types';
import * as operations from '../data/operations';
import { loadData, persistData } from '../data/storage';
import { errorMessage } from '../utils/format';

interface AppContextValue {
  data: AppData;
  status: 'loading' | 'ready' | 'error';
  loadError: string;
  refreshing: boolean;
  refresh: () => Promise<void>;
  retry: () => void;
  saveField: (draft: FieldDraft, id?: string) => Promise<void>;
  deleteField: (id: string) => Promise<void>;
  addBooking: (fieldId: string, draft: BookingDraft) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
}

const emptyData: AppData = { version: 1, fields: [], bookings: [] };
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [status, setStatus] = useState<AppContextValue['status']>('loading');
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const current = useRef<AppData | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const refreshTask = useRef<Promise<void> | null>(null);
  const alive = useRef(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setStatus('loading');
    setLoadError('');
    loadData()
      .then(saved => {
        if (mounted) {
          current.current = saved;
          setData(saved);
          setStatus('ready');
        }
      })
      .catch(error => {
        if (mounted) {
          setLoadError(errorMessage(error));
          setStatus('error');
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadAttempt]);

  const commit = useCallback(
    (update: (previous: AppData) => AppData): Promise<void> => {
      // Serialize writes and publish only after saving succeeds. A failed write
      // leaves both the visible state and the previously saved snapshot intact.
      const task = queue.current.then(async () => {
        if (!current.current) {
          throw new Error('Dữ liệu chưa tải xong. Vui lòng thử lại.');
        }
        const next = update(current.current);
        await persistData(next);
        current.current = next;
        if (alive.current) {
          setData(next);
        }
      });
      queue.current = task.catch(() => {});
      return task;
    },
    [],
  );

  const refresh = useCallback((): Promise<void> => {
    if (refreshTask.current) {
      return refreshTask.current;
    }
    if (!current.current) {
      return Promise.reject(
        new Error('Dữ liệu chưa tải xong. Vui lòng thử lại.'),
      );
    }
    setRefreshing(true);
    // Read on the same queue as writes so a refresh cannot overwrite a save
    // with a stale snapshot. Keep status ready to preserve the current route.
    const task = queue.current.then(async () => {
      const saved = await loadData();
      current.current = saved;
      if (alive.current) {
        setData(saved);
      }
    });
    queue.current = task.catch(() => {});
    const completion = task.finally(() => {
      refreshTask.current = null;
      if (alive.current) {
        setRefreshing(false);
      }
    });
    refreshTask.current = completion;
    return completion;
  }, []);

  const value: AppContextValue = {
    data,
    status,
    loadError,
    refreshing,
    refresh,
    retry: () => setLoadAttempt(attempt => attempt + 1),
    saveField: (draft, id) =>
      commit(previous => operations.saveField(previous, draft, id)),
    deleteField: id => commit(previous => operations.deleteField(previous, id)),
    addBooking: (fieldId, draft) =>
      commit(previous => operations.addBooking(previous, fieldId, draft)),
    cancelBooking: id =>
      commit(previous => operations.cancelBooking(previous, id)),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
