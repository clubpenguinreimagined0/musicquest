import { useState, useRef } from 'react';
import { classifyMultipleArtists } from '../utils/genreClassifier';
import { getProgress, clearProgress, getListeningData } from '../utils/storage/indexedDB';
import { useData } from '../context/DataContext';

export const useGenreFetch = () => {
  const { state, dispatch, actionTypes } = useData();
  const [isFetching, setIsFetching] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const abortControllerRef = useRef(null);

  const checkForResumableProgress = async () => {
    const progress = await getProgress();
    if (progress && !progress.cancelled && progress.currentIndex < progress.total) {
      setCanResume(true);
      return progress;
    }
    setCanResume(false);
    return null;
  };

  const cancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const fetchGenres = async (listens, resume = false) => {
    if (!listens || listens.length === 0) {
      return { success: false, error: 'No listens to process' };
    }

    setIsFetching(true);
    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    abortControllerRef.current = new AbortController();

    try {
      const uniqueArtists = [...new Set(listens.map(listen => listen.artistName))];

      let resumeData = null;
      if (resume) {
        resumeData = await getProgress();
      } else {
        await clearProgress();
      }

      const onProgress = (progressData) => {
        if (progressData.progress) {
          dispatch({
            type: actionTypes.SET_GENRE_PROGRESS,
            payload: {
              current: progressData.progress.current,
              total: progressData.progress.total,
              currentArtist: progressData.artist
            }
          });
        }
      };

      const onComplete = async (genreMap) => {
        dispatch({ type: actionTypes.SET_GENRE_MAP, payload: genreMap });

        const updatedListens = await getListeningData();
        dispatch({ type: actionTypes.SET_LISTENS, payload: updatedListens });
      };

      const genreMap = await classifyMultipleArtists(
        uniqueArtists,
        onProgress,
        onComplete,
        abortControllerRef.current.signal,
        5,
        resumeData
      );

      await clearProgress();
      setCanResume(false);

      const updatedListens = await getListeningData();
      dispatch({ type: actionTypes.SET_LISTENS, payload: updatedListens });

      setIsFetching(false);
      dispatch({ type: actionTypes.SET_LOADING, payload: false });

      console.log('✅ Genre classification complete and listens refreshed');

      return { success: true, genreMap };
    } catch (error) {
      console.error('Genre fetching error:', error);
      setIsFetching(false);
      dispatch({ type: actionTypes.SET_LOADING, payload: false });

      if (error.message === 'Classification cancelled') {
        setCanResume(true);
        return { success: false, error: 'Classification cancelled', cancelled: true };
      }

      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      abortControllerRef.current = null;
    }
  };

  return { fetchGenres, isFetching, canResume, checkForResumableProgress, cancelFetch };
};
