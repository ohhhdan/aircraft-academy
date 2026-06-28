import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Aircraft } from '../types';
import {
  clearDiagram,
  clearSpotPhoto,
  exportMediaPack,
  getAllRecords,
  importMediaPack,
  resolveMedia,
  setDiagram,
  setSpotPhoto,
  type AircraftMediaRecord,
  type ResolvedMedia,
} from '../utils/mediaStore';
import { getPhotoUrl as getDefaultPhotoUrl, getDiagramUrl as getDefaultDiagramUrl } from '../utils/data';

interface MediaContextValue {
  loading: boolean;
  records: Map<string, AircraftMediaRecord>;
  resolved: Map<string, ResolvedMedia>;
  getSpotPhoto: (ac: Aircraft, variant?: string) => { url: string; attribution: string };
  getDiagram: (ac: Aircraft) => { url: string; attribution?: string } | null;
  saveSpotPhoto: (
    aircraftId: string,
    input: { url?: string; file?: File; attribution?: string; variant?: string }
  ) => Promise<void>;
  saveDiagram: (
    aircraftId: string,
    input: { url?: string; file?: File; attribution?: string }
  ) => Promise<void>;
  removeSpotPhoto: (aircraftId: string) => Promise<void>;
  removeDiagram: (aircraftId: string) => Promise<void>;
  exportPack: () => Promise<void>;
  importPack: (file: File) => Promise<number>;
  refresh: () => Promise<void>;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Map<string, AircraftMediaRecord>>(new Map());
  const [resolved, setResolved] = useState<Map<string, ResolvedMedia>>(new Map());

  const refresh = useCallback(async () => {
    const all = await getAllRecords();
    const recMap = new Map(all.map((r) => [r.aircraftId, r]));
    const resMap = new Map<string, ResolvedMedia>();

    for (const rec of all) {
      resMap.set(rec.aircraftId, await resolveMedia(rec));
    }

    setRecords(recMap);
    setResolved(resMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSpotPhoto = useCallback(
    (ac: Aircraft, variant?: string) => {
      const custom = resolved.get(ac.id)?.spotPhoto;
      if (custom?.url) return custom;
      return getDefaultPhotoUrl(ac, variant);
    },
    [resolved]
  );

  const getDiagram = useCallback(
    (ac: Aircraft) => {
      const custom = resolved.get(ac.id)?.diagram;
      if (custom?.url) return custom;
      return getDefaultDiagramUrl(ac);
    },
    [resolved]
  );

  const saveSpotPhoto = useCallback(
    async (aircraftId: string, input: Parameters<MediaContextValue['saveSpotPhoto']>[1]) => {
      await setSpotPhoto(aircraftId, input);
      await refresh();
    },
    [refresh]
  );

  const saveDiagram = useCallback(
    async (aircraftId: string, input: Parameters<MediaContextValue['saveDiagram']>[1]) => {
      await setDiagram(aircraftId, input);
      await refresh();
    },
    [refresh]
  );

  const removeSpotPhoto = useCallback(
    async (aircraftId: string) => {
      await clearSpotPhoto(aircraftId);
      await refresh();
    },
    [refresh]
  );

  const removeDiagram = useCallback(
    async (aircraftId: string) => {
      await clearDiagram(aircraftId);
      await refresh();
    },
    [refresh]
  );

  const exportPack = useCallback(async () => {
    const json = await exportMediaPack();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `runway-reference-media-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const importPack = useCallback(
    async (file: File) => {
      const text = await file.text();
      const count = await importMediaPack(text);
      await refresh();
      return count;
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      loading,
      records,
      resolved,
      getSpotPhoto,
      getDiagram,
      saveSpotPhoto,
      saveDiagram,
      removeSpotPhoto,
      removeDiagram,
      exportPack,
      importPack,
      refresh,
    }),
    [
      loading,
      records,
      resolved,
      getSpotPhoto,
      getDiagram,
      saveSpotPhoto,
      saveDiagram,
      removeSpotPhoto,
      removeDiagram,
      exportPack,
      importPack,
      refresh,
    ]
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used within MediaProvider');
  return ctx;
}
