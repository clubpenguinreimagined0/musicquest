import { createContext, useContext, useReducer, useEffect } from 'react';
import { initDB, saveListeningData, getListeningData } from '../utils/storage/indexedDB';
import { getItem, setItem, StorageType } from '../utils/storage/secureStorage';

const DataContext = createContext();

const initialState = {
  listens: [],
  genreMap: new Map(),
  groupedData: [],
  transitions: [],
  timePeriod: 'monthly',
  visualizationMode: 'sankey',
  isLoading: false,
  error: null,
  darkMode: false,
  storageMode: StorageType.LOCAL,
  listenbrainzToken: null,
  selectedGenres: [],
  animationState: {
    isPlaying: false,
    speed: 1,
    currentIndex: 0
  },
  genreClassificationProgress: {
    current: 0,
    total: 0,
    currentArtist: ''
  }
};

const actionTypes = {
  SET_LISTENS: 'SET_LISTENS',
  SET_GENRE_MAP: 'SET_GENRE_MAP',
  SET_GROUPED_DATA: 'SET_GROUPED_DATA',
  SET_TRANSITIONS: 'SET_TRANSITIONS',
  SET_TIME_PERIOD: 'SET_TIME_PERIOD',
  SET_VISUALIZATION_MODE: 'SET_VISUALIZATION_MODE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_STORAGE_MODE: 'SET_STORAGE_MODE',
  SET_LISTENBRAINZ_TOKEN: 'SET_LISTENBRAINZ_TOKEN',
  SET_SELECTED_GENRES: 'SET_SELECTED_GENRES',
  SET_ANIMATION_STATE: 'SET_ANIMATION_STATE',
  SET_GENRE_PROGRESS: 'SET_GENRE_PROGRESS',
  CLEAR_DATA: 'CLEAR_DATA'
};

const dataReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LISTENS:
      return { ...state, listens: action.payload };
    case actionTypes.SET_GENRE_MAP:
      return { ...state, genreMap: action.payload };
    case actionTypes.SET_GROUPED_DATA:
      return { ...state, groupedData: action.payload };
    case actionTypes.SET_TRANSITIONS:
      return { ...state, transitions: action.payload };
    case actionTypes.SET_TIME_PERIOD:
      return { ...state, timePeriod: action.payload };
    case actionTypes.SET_VISUALIZATION_MODE:
      return { ...state, visualizationMode: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case actionTypes.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };
    case actionTypes.SET_STORAGE_MODE:
      return { ...state, storageMode: action.payload };
    case actionTypes.SET_LISTENBRAINZ_TOKEN:
      return { ...state, listenbrainzToken: action.payload };
    case actionTypes.SET_SELECTED_GENRES:
      return { ...state, selectedGenres: action.payload };
    case actionTypes.SET_ANIMATION_STATE:
      return { ...state, animationState: { ...state.animationState, ...action.payload } };
    case actionTypes.SET_GENRE_PROGRESS:
      return { ...state, genreClassificationProgress: action.payload };
    case actionTypes.CLEAR_DATA:
      return { ...initialState, darkMode: state.darkMode, storageMode: state.storageMode };
    default:
      return state;
  }
};

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  useEffect(() => {
    const savedDarkMode = getItem('darkMode', StorageType.LOCAL);
    if (savedDarkMode === 'true') {
      dispatch({ type: actionTypes.TOGGLE_DARK_MODE });
    }

    const savedToken = getItem('listenbrainz_token', StorageType.LOCAL, true);
    if (savedToken) {
      dispatch({ type: actionTypes.SET_LISTENBRAINZ_TOKEN, payload: savedToken });
    }

    initDB().catch(console.error);
  }, []);

  useEffect(() => {
    setItem('darkMode', state.darkMode.toString(), StorageType.LOCAL);
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const value = {
    state,
    dispatch,
    actionTypes
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
