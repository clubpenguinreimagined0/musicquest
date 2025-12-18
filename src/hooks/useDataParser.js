import { useState } from 'react';
import { parseListenBrainzJSON, validateListenBrainzJSON } from '../utils/parsers/listenbrainz';
import { parseSpotifyJSON, validateSpotifyJSON } from '../utils/parsers/spotify';
import { parseJSONL, isJSONLFile } from '../utils/parsers/jsonlParser';
import { mergeListeningData } from '../utils/storage/indexedDB';
import { useData } from '../context/DataContext';
import errorLogger from '../utils/errorLogger';
import { cleanGenreData } from '../utils/genreTaxonomy';
import { validateListeningData } from '../utils/dataMerge';

export const useDataParser = () => {
  const { dispatch, actionTypes } = useData();
  const [parseProgress, setParseProgress] = useState({ percentage: 0, status: '', currentFile: '' });

  const parseFiles = async (files, fileType) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.SET_ERROR, payload: null });

    try {
      const maxSize = 250 * 1024 * 1024;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);

      if (totalSize > maxSize) {
        throw new Error(`Total file size exceeds 250MB limit. Total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }

      setParseProgress({ percentage: 0, status: 'Reading files...', currentFile: '' });

      const allListens = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePercentage = (i / files.length) * 100;

        setParseProgress({
          percentage: filePercentage,
          status: `Processing file ${i + 1} of ${files.length}...`,
          currentFile: file.name
        });

        try {
          let fileData;

          if (isJSONLFile(file.name)) {
            fileData = await parseJSONL(file, (progress) => {
              const totalProgress = filePercentage + (progress.percentage / files.length);
              setParseProgress({
                percentage: totalProgress,
                status: `Parsing ${file.name}... ${progress.percentage}%`,
                currentFile: file.name
              });
            });
          } else {
            const fileContent = await file.text();
            fileData = JSON.parse(fileContent);

            if (!Array.isArray(fileData)) {
              fileData = [fileData];
            }
          }

          setParseProgress({
            percentage: ((i + 0.5) / files.length) * 100,
            status: `Validating ${file.name}...`,
            currentFile: file.name
          });

          let parseResult;

          if (fileType === 'listenbrainz') {
            const validation = validateListenBrainzJSON(fileData);
            if (!validation.valid) {
              errorLogger.warn(`Invalid ListenBrainz format in ${file.name}: ${validation.message}`, {
                context: 'file validation',
                file: file.name
              });
              console.warn(`Skipping ${file.name}: ${validation.message}`);
              continue;
            }
            parseResult = parseListenBrainzJSON(fileData);
          } else if (fileType === 'spotify') {
            const validation = validateSpotifyJSON(fileData);
            if (!validation.valid) {
              errorLogger.warn(`Invalid Spotify format in ${file.name}: ${validation.message}`, {
                context: 'file validation',
                file: file.name
              });
              console.warn(`Skipping ${file.name}: ${validation.message}`);
              continue;
            }
            parseResult = parseSpotifyJSON(fileData);
          } else {
            throw new Error('Unknown file type');
          }

          if (!parseResult.success) {
            errorLogger.log(new Error(parseResult.error), {
              context: 'file parsing',
              file: file.name
            });
            console.warn(`Error parsing ${file.name}:`, parseResult.error);
            continue;
          }

          allListens.push(...parseResult.listens);
          errorLogger.info(`Successfully parsed ${parseResult.listens.length} listens from ${file.name}`, {
            context: 'file parsing',
            file: file.name,
            count: parseResult.listens.length
          });
        } catch (error) {
          errorLogger.log(error, {
            context: 'file processing',
            file: file.name,
            details: error.message
          });
          console.error(`Error processing ${file.name}:`, error);
          continue;
        }
      }

      if (allListens.length === 0) {
        throw new Error('No valid listens found in uploaded files');
      }

      allListens.sort((a, b) => {
        const aTime = a.timestamp || a.listened_at || 0;
        const bTime = b.timestamp || b.listened_at || 0;
        return aTime - bTime;
      });

      setParseProgress({ percentage: 70, status: 'Cleaning genre data...', currentFile: '' });

      const { cleanedListens, report: genreReport } = cleanGenreData(allListens);

      setParseProgress({ percentage: 80, status: 'Merging with existing data...', currentFile: '' });

      const mergeResult = await mergeListeningData(cleanedListens);

      if (!mergeResult.success) {
        throw new Error(mergeResult.error || 'Failed to merge data');
      }

      const validation = validateListeningData({ listens: mergeResult.data });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      dispatch({ type: actionTypes.SET_LISTENS, payload: mergeResult.data });

      setParseProgress({ percentage: 100, status: 'Complete!', currentFile: '' });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });

      const timestamps = mergeResult.data.map(l => l.timestamp || l.listened_at || 0);
      const earliest = new Date(Math.min(...timestamps) * 1000);
      const latest = new Date(Math.max(...timestamps) * 1000);

      errorLogger.info(`Successfully processed ${files.length} files`, {
        context: 'file parsing complete',
        fileCount: files.length,
        imported: allListens.length,
        total: mergeResult.data.length,
        duplicatesRemoved: mergeResult.mergeInfo.duplicates,
        dateRange: `${earliest.getFullYear()}-${latest.getFullYear()}`,
        genreCleanup: genreReport
      });

      return {
        success: true,
        count: mergeResult.data.length,
        listens: mergeResult.data,
        mergeInfo: mergeResult.mergeInfo,
        genreReport: genreReport,
        dateRange: { earliest, latest }
      };
    } catch (error) {
      console.error('File parsing error:', error);
      errorLogger.log(error, {
        context: 'file parsing',
        fileCount: files.length
      });
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      setParseProgress({ percentage: 0, status: '', currentFile: '' });
      return { success: false, error: error.message };
    }
  };

  return { parseFiles, parseProgress };
};
