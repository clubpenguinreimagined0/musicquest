const MIN_VALID_TIMESTAMP = 946684800;   // Jan 1, 2000 (music streaming era)
const MAX_VALID_TIMESTAMP = 2147483647;  // Jan 19, 2038 (Unix 32-bit limit)

export function validateAndCleanTimestamps(listens) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🕐 TIMESTAMP VALIDATION STARTED`);
  console.log(`   Processing ${listens.length.toLocaleString()} listens...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let cleanedCount = 0;
  let removedCount = 0;
  let convertedFromMs = 0;
  const issues = [];

  const cleanedListens = listens.map((listen, index) => {
    let ts = listen.timestamp || listen.listened_at;

    if (!ts) {
      issues.push({
        index,
        track: listen.trackName || 'Unknown',
        artist: listen.artistName || 'Unknown',
        issue: 'Missing timestamp',
        original: ts
      });
      removedCount++;
      return null;
    }

    const originalTs = ts;

    if (ts > 10000000000) {
      ts = Math.floor(ts / 1000);
      convertedFromMs++;
      cleanedCount++;
    }

    if (ts < MIN_VALID_TIMESTAMP) {
      issues.push({
        index,
        track: listen.trackName || 'Unknown',
        artist: listen.artistName || 'Unknown',
        issue: `Timestamp too early (before 2000)`,
        original: originalTs,
        cleaned: ts,
        date: new Date(ts * 1000).toISOString()
      });

      if (listen.additionalInfo?.original_timestamp) {
        const fallback = new Date(listen.additionalInfo.original_timestamp);
        if (!isNaN(fallback.getTime())) {
          const fallbackTs = Math.floor(fallback.getTime() / 1000);
          if (fallbackTs >= MIN_VALID_TIMESTAMP && fallbackTs <= MAX_VALID_TIMESTAMP) {
            ts = fallbackTs;
            cleanedCount++;
            console.log(`   ✅ Fixed using original_timestamp: "${listen.trackName}" → ${new Date(ts * 1000).toISOString()}`);
          }
        }
      }

      if (ts < MIN_VALID_TIMESTAMP) {
        removedCount++;
        return null;
      }
    }

    if (ts > MAX_VALID_TIMESTAMP) {
      issues.push({
        index,
        track: listen.trackName || 'Unknown',
        artist: listen.artistName || 'Unknown',
        issue: `Timestamp too late (after 2038)`,
        original: originalTs,
        cleaned: ts,
        date: new Date(ts * 1000).toISOString()
      });
      removedCount++;
      return null;
    }

    if (!Number.isInteger(ts) || ts <= 0) {
      issues.push({
        index,
        track: listen.trackName || 'Unknown',
        artist: listen.artistName || 'Unknown',
        issue: 'Invalid timestamp format',
        original: originalTs
      });
      removedCount++;
      return null;
    }

    return {
      ...listen,
      timestamp: ts,
      listened_at: ts,
      timestampMetadata: {
        validated: true,
        originalFormat: originalTs > 10000000000 ? 'milliseconds' : 'seconds',
        convertedFromMs: originalTs > 10000000000
      }
    };
  }).filter(Boolean);

  const validationRate = listens.length > 0
    ? ((cleanedListens.length / listens.length) * 100).toFixed(1)
    : 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TIMESTAMP VALIDATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Original listens:   ${listens.length.toLocaleString()}`);
  console.log(`   Converted from ms:  ${convertedFromMs.toLocaleString()}`);
  console.log(`   Cleaned:            ${cleanedCount.toLocaleString()}`);
  console.log(`   Removed (invalid):  ${removedCount.toLocaleString()}`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   Valid listens:      ${cleanedListens.length.toLocaleString()} (${validationRate}%)`);

  if (cleanedListens.length > 0) {
    const timestamps = cleanedListens.map(l => l.timestamp);
    const earliest = new Date(Math.min(...timestamps) * 1000);
    const latest = new Date(Math.max(...timestamps) * 1000);
    const yearSpan = ((Math.max(...timestamps) - Math.min(...timestamps)) / (365.25 * 24 * 60 * 60)).toFixed(1);

    console.log(`   Date range:         ${earliest.getFullYear()}-${latest.getFullYear()} (${yearSpan} years)`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (issues.length > 0) {
    console.log(`⚠️  Issues found (showing first 5 of ${issues.length}):`);
    issues.slice(0, 5).forEach((issue, i) => {
      console.log(`   ${i + 1}. "${issue.track}" by ${issue.artist}`);
      console.log(`      ${issue.issue}`);
      if (issue.date) {
        console.log(`      Date: ${issue.date}`);
      }
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  if (removedCount > 0) {
    console.warn(`⚠️  Warning: Removed ${removedCount} listens with invalid timestamps`);
  }

  return {
    listens: cleanedListens,
    stats: {
      original: listens.length,
      valid: cleanedListens.length,
      removed: removedCount,
      cleaned: cleanedCount,
      convertedFromMs,
      issues: issues.length
    },
    issues: issues
  };
}

export function validateTimestampRange(listens) {
  if (!listens || listens.length === 0) {
    return { valid: false, error: 'No listens to validate' };
  }

  const timestamps = listens
    .map(l => l.timestamp || l.listened_at)
    .filter(ts => ts && typeof ts === 'number');

  if (timestamps.length === 0) {
    return { valid: false, error: 'No valid timestamps found' };
  }

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);

  if (min < MIN_VALID_TIMESTAMP) {
    return {
      valid: false,
      error: `Timestamps before streaming era detected (${new Date(min * 1000).toISOString()})`,
      min,
      max
    };
  }

  if (max > MAX_VALID_TIMESTAMP) {
    return {
      valid: false,
      error: `Timestamps beyond 2038 detected (${new Date(max * 1000).toISOString()})`,
      min,
      max
    };
  }

  return {
    valid: true,
    min,
    max,
    range: {
      earliest: new Date(min * 1000),
      latest: new Date(max * 1000),
      yearSpan: ((max - min) / (365.25 * 24 * 60 * 60)).toFixed(1)
    }
  };
}

export function detectTimestampFormat(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return { format: 'invalid', timestamp: null };
  }

  if (timestamp > 10000000000) {
    return {
      format: 'milliseconds',
      timestamp,
      converted: Math.floor(timestamp / 1000),
      date: new Date(timestamp)
    };
  }

  return {
    format: 'seconds',
    timestamp,
    converted: timestamp,
    date: new Date(timestamp * 1000)
  };
}

if (typeof window !== 'undefined') {
  window.validateTimestamps = async () => {
    const { initDB } = await import('./storage/indexedDB.js');
    const db = await initDB();
    const listens = await db.getAll('listens');
    return validateAndCleanTimestamps(listens);
  };

  window.checkTimestampRange = async () => {
    const { initDB } = await import('./storage/indexedDB.js');
    const db = await initDB();
    const listens = await db.getAll('listens');
    return validateTimestampRange(listens);
  };

  console.log('💡 Timestamp validation debug tools available:');
  console.log('   - window.validateTimestamps()');
  console.log('   - window.checkTimestampRange()');
}
