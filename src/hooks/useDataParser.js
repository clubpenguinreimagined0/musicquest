import { useState } from 'react';
import { parseImportedData } from '../utils/parsers/universalParser';  // ← YOUR NEW PARSER
import { parseJSONL, isJSONLFile } from '../utils/parsers/jsonlParser';
import { mergeListeningData } from '../utils/storage/indexedDB';
import { useData } from '../context/DataContext';
import errorLogger from '../utils/errorLogger';
import { cleanGenreData } from '../utils/genreTaxonomy';
import { validateListeningData } from '../utils/dataMerge';

export const useDataParser = () => {
  const { dispatch, actionTypes } = useData();
  const [parseProgress, setParseProgress] = useState({ 
    percentage: 0, 
    status: '', 
    currentFile: '' 
  });

  const parseFiles = async (files) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.SET_ERROR, payload: null });

    try {
      // Validate total file size
      const maxSize = 250 * 1024 * 1024; // 250MB
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);

      if (totalSize > maxSize) {
        throw new Error(
          `Total file size exceeds 250MB limit. ` +
          `Total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`
        );
      }

      setParseProgress({ 
        percentage: 0, 
        status: 'Reading files...', 
        currentFile: '' 
      });

      const allListens = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePercentage = (i / files.length) * 100;

        setParseProgress({
          percentage: filePercentage,
          status: `Processing file ${i + 1} of ${files.length}...`,
          currentFile: file.name
        });

        try {
          let rawData;

          // Handle JSONL files
          if (isJSONLFile(file.name)) {
            rawData = await parseJSONL(file, (progress) => {
              const totalProgress = filePercentage + (progress.percentage / files.length);
              setParseProgress({
                percentage: totalProgress,
                status: `Parsing ${file.name}... ${progress.percentage}%`,
                currentFile: file.name
              });
            });
          } else {
            // Handle JSON files
            const fileContent = await file.text();
            rawData = JSON.parse(fileContent);
          }

          // ✅ CRITICAL: Use universal parser for ALL formats
          const parseResult = parseImportedData(
            typeof rawData === 'string' ? rawData : JSON.stringify(rawData),
            file.name
          );

          if (!parseResult || !parseResult.listens || parseResult.listens.length === 0) {
            errorLogger.warn(`No listens found in ${file.name}`, {
              context: 'file parsing',
              file: file.name
            });
            console.warn(`⚠️ Skipping ${file.name}: No listens found`);
            continue;
          }

          // Convert to standard format (ensure listened_at is in seconds)
          const standardizedListens = parseResult.listens.map((listen, idx) => ({
            id: `${parseResult.format}-${i}-${idx}-${listen.listened_at}`,
            timestamp: listen.listened_at,  // ← Unix seconds
            listened_at: listen.listened_at,  // ← Unix seconds
            trackName: listen.track_metadata?.track_name || 'Unknown Track',
            artistName: listen.track_metadata?.artist_name || 'Unknown Artist',
            albumName: listen.track_metadata?.release_name || 'Unknown Album',
            additionalInfo: listen.track_metadata?.additional_info || {},
            source: listen.source || parseResult.format
          }));

          allListens.push(...standardizedListens);

          errorLogger.info(
            `Successfully parsed ${standardizedListens.length} listens from ${file.name}`,
            {
              context: 'file parsing',
              file: file.name,
              count: standardizedListens.length,
              format: parseResult.format
            }
          );

        } catch (error) {
          errorLogger.log(error, {
            context: 'file processing',
            file: file.name,
            details: error.message
          });
          console.error(`❌ Error processing ${file.name}:`, error);
          continue; // Skip failed files
        }
      }

      // Validate we got data
      if (allListens.length === 0) {
        throw new Error('No valid listens found in uploaded files');
      }

      // Sort by timestamp
      allListens.sort((a, b) => (a.listened_at || 0) - (b.listened_at || 0));

      // Clean genre data
      setParseProgress({
        percentage: 60,
        status: 'Cleaning genre data...',
        currentFile: ''
      });

      const { cleanedListens, report: genreReport } = cleanGenreData(allListens);

      // Validate and clean timestamps
      setParseProgress({
        percentage: 65,
        status: 'Validating timestamps...',
        currentFile: ''
      });

      const { validateAndCleanTimestamps } = await import('../utils/timestampValidation.js');
      const timestampResult = validateAndCleanTimestamps(cleanedListens);

      if (timestampResult.stats.removed > 0) {
        console.warn(`⚠️  Removed ${timestampResult.stats.removed} listens with invalid timestamps`);
      }

      // Merge with existing data
      setParseProgress({
        percentage: 75,
        status: 'Merging with existing data...',
        currentFile: ''
      });

      const mergeResult = await mergeListeningData(timestampResult.listens);

      if (!mergeResult.success) {
        throw new Error(mergeResult.error || 'Failed to merge data');
      }

      // Validate final data
      const validation = validateListeningData({ listens: mergeResult.data });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setParseProgress({
        percentage: 85,
        status: 'Finalizing import...',
        currentFile: ''
      });

      let finalListens = mergeResult.data;

      // Update state with imported data
      dispatch({ type: actionTypes.SET_LISTENS, payload: finalListens });

      setParseProgress({
        percentage: 100,
        status: 'Complete!',
        currentFile: ''
      });

      dispatch({ type: actionTypes.SET_LOADING, payload: false });

      // Calculate date range
      const timestamps = finalListens.map(l => l.listened_at || 0);
      const earliest = new Date(Math.min(...timestamps) * 1000);
      const latest = new Date(Math.max(...timestamps) * 1000);

      errorLogger.info(`Successfully processed ${files.length} files`, {
        context: 'file parsing complete',
        fileCount: files.length,
        imported: allListens.length,
        timestampsCleaned: timestampResult.stats.cleaned,
        timestampsRemoved: timestampResult.stats.removed,
        total: finalListens.length,
        duplicatesRemoved: mergeResult.mergeInfo?.duplicates || 0,
        dateRange: `${earliest.getFullYear()}-${latest.getFullYear()}`,
        genreCleanup: genreReport
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎵 TRIGGERING POST-IMPORT ENRICHMENT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setTimeout(async () => {
        try {
          const { enrichListensWithGenres } = await import('../utils/genreEnrichment.js');
          const enrichedListens = await enrichListensWithGenres(finalListens, true);

          const enrichedCount = enrichedListens.filter(l =>
            l.genres && l.genres.length > 0 && l.genres[0] !== 'Unknown'
          ).length;

          dispatch({ type: actionTypes.SET_LISTENS, payload: enrichedListens });

          console.log(`✅ Post-import enrichment complete: ${enrichedCount}/${enrichedListens.length} listens enriched`);
        } catch (error) {
          console.error('❌ Post-import enrichment failed:', error);
        }
      }, 1000);

      return {
        success: true,
        count: finalListens.length,
        listens: finalListens,
        mergeInfo: mergeResult.mergeInfo,
        genreReport: genreReport,
        timestampStats: timestampResult.stats,
        dateRange: { earliest, latest }
      };

    } catch (error) {
      console.error('❌ File parsing error:', error);
      errorLogger.log(error, {
        context: 'file parsing',
        fileCount: files?.length || 0
      });
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      setParseProgress({ percentage: 0, status: '', currentFile: '' });
      return { success: false, error: error.message };
    }
  };

  return { parseFiles, parseProgress };
};
