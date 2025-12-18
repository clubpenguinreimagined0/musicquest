export const parseJSONL = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const results = [];
    let lineBuffer = '';
    let processedBytes = 0;
    const totalBytes = file.size;

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = (lineBuffer + text).split('\n');

      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          try {
            const parsed = JSON.parse(trimmedLine);
            results.push(parsed);
          } catch (error) {
            console.warn('Failed to parse JSONL line:', error, 'Line:', trimmedLine.substring(0, 100));
          }
        }
      }

      processedBytes += text.length;
      if (onProgress) {
        onProgress({
          processed: processedBytes,
          total: totalBytes,
          percentage: Math.round((processedBytes / totalBytes) * 100)
        });
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.onloadend = () => {
      if (lineBuffer.trim()) {
        try {
          const parsed = JSON.parse(lineBuffer);
          results.push(parsed);
        } catch (error) {
          console.warn('Failed to parse final JSONL line:', error);
        }
      }
      resolve(results);
    };

    const chunkSize = 1024 * 1024;
    let offset = 0;

    const readNextChunk = () => {
      if (offset < file.size) {
        const blob = file.slice(offset, offset + chunkSize);
        offset += chunkSize;
        reader.readAsText(blob);
      } else {
        reader.onloadend();
      }
    };

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = (lineBuffer + text).split('\n');

      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          try {
            const parsed = JSON.parse(trimmedLine);
            results.push(parsed);
          } catch (error) {
            console.warn('Failed to parse JSONL line:', error);
          }
        }
      }

      processedBytes += text.length;
      if (onProgress) {
        onProgress({
          processed: processedBytes,
          total: totalBytes,
          percentage: Math.round((processedBytes / totalBytes) * 100)
        });
      }

      readNextChunk();
    };

    readNextChunk();
  });
};

export const isJSONLFile = (filename) => {
  return filename.toLowerCase().endsWith('.jsonl');
};

export const parseMultipleFiles = async (files, onFileProgress, onOverallProgress) => {
  const allResults = [];
  let totalProcessed = 0;
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onFileProgress) {
      onFileProgress({
        currentFile: file.name,
        fileIndex: i + 1,
        totalFiles
      });
    }

    try {
      let data;
      if (isJSONLFile(file.name)) {
        data = await parseJSONL(file, (progress) => {
          if (onOverallProgress) {
            onOverallProgress({
              ...progress,
              currentFile: file.name,
              filesProcessed: i,
              totalFiles
            });
          }
        });
      } else {
        const text = await file.text();
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          data = [data];
        }
      }

      allResults.push(...data);
      totalProcessed++;

      if (onOverallProgress) {
        onOverallProgress({
          filesProcessed: totalProcessed,
          totalFiles,
          percentage: Math.round((totalProcessed / totalFiles) * 100)
        });
      }
    } catch (error) {
      console.error(`Failed to parse file ${file.name}:`, error);
      if (onFileProgress) {
        onFileProgress({
          error: `Failed to parse ${file.name}: ${error.message}`,
          currentFile: file.name,
          fileIndex: i + 1,
          totalFiles
        });
      }
    }
  }

  return allResults;
};
