export async function cleanCorruptedTimestamps() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 TIMESTAMP CLEANUP STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const MIN_VALID_TS = 946684800;
  const MAX_VALID_TS = 2147483647;

  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('MusicQuestDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const tx = db.transaction('listens', 'readwrite');
    const store = tx.objectStore('listens');

    const allListens = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`   Found ${allListens.length.toLocaleString()} total listens`);

    let cleaned = 0;
    let removed = 0;
    let skipped = 0;
    const issues = [];

    for (const listen of allListens) {
      let ts = listen.timestamp || listen.listened_at;

      if (!ts || ts < MIN_VALID_TS || ts > MAX_VALID_TS) {
        if (listen.additionalInfo?.original_timestamp) {
          const recoveredDate = new Date(listen.additionalInfo.original_timestamp);
          if (!isNaN(recoveredDate.getTime())) {
            ts = Math.floor(recoveredDate.getTime() / 1000);

            if (ts >= MIN_VALID_TS && ts <= MAX_VALID_TS) {
              await store.put({
                ...listen,
                timestamp: ts,
                listened_at: ts,
                timestampMetadata: {
                  validated: true,
                  recovered: true,
                  originalValue: listen.timestamp || listen.listened_at,
                  recoveredFrom: 'original_timestamp'
                }
              });

              cleaned++;
              console.log(`   ✅ Recovered: "${listen.trackName}" by ${listen.artistName} → ${new Date(ts * 1000).toISOString()}`);
              continue;
            }
          }
        }

        issues.push({
          id: listen.id,
          track: listen.trackName || 'Unknown',
          artist: listen.artistName || 'Unknown',
          timestamp: ts,
          date: ts ? new Date(ts * 1000).toISOString() : 'invalid'
        });

        await store.delete(listen.id);
        removed++;
      } else {
        skipped++;
      }
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TIMESTAMP CLEANUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total listens:      ${allListens.length.toLocaleString()}`);
    console.log(`   Valid (skipped):    ${skipped.toLocaleString()}`);
    console.log(`   Cleaned/recovered:  ${cleaned.toLocaleString()}`);
    console.log(`   Removed (corrupt):  ${removed.toLocaleString()}`);
    console.log(`   ─────────────────────────────────`);
    console.log(`   Remaining:          ${(skipped + cleaned).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (issues.length > 0) {
      console.log(`⚠️  Removed listens (showing first 10 of ${issues.length}):`);
      issues.slice(0, 10).forEach((issue, i) => {
        console.log(`   ${i + 1}. "${issue.track}" by ${issue.artist}`);
        console.log(`      Timestamp: ${issue.timestamp} → ${issue.date}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    if (cleaned > 0 || removed > 0) {
      console.log('🔄 Reloading page in 2 seconds to refresh visualization...');
      setTimeout(() => location.reload(), 2000);
    }

    return {
      success: true,
      total: allListens.length,
      cleaned,
      removed,
      remaining: skipped + cleaned,
      issues
    };

  } catch (error) {
    console.error('❌ Timestamp cleanup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

if (typeof window !== 'undefined') {
  window.cleanCorruptedTimestamps = cleanCorruptedTimestamps;

  console.log('💡 Timestamp cleanup tool available:');
  console.log('   - window.cleanCorruptedTimestamps()');
  console.log('   Run this if you have corrupted timestamps in your database');
}
