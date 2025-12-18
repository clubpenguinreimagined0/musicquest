import { initDB, STORES } from './storage/indexedDB';

export async function updateListensWithGenres(artistName, genres, source = 'classification') {
  if (!artistName || !genres || genres.length === 0) {
    console.warn('Cannot update listens: missing artist or genres');
    return 0;
  }

  try {
    const db = await initDB();
    const tx = db.transaction(STORES.LISTENS, 'readwrite');
    const store = tx.objectStore(STORES.LISTENS);

    const allListens = await store.getAll();

    const artistListens = allListens.filter(
      l => l.artistName === artistName ||
           l.track_metadata?.artist_name === artistName
    );

    if (artistListens.length === 0) {
      return 0;
    }

    let updated = 0;

    for (const listen of artistListens) {
      try {
        await store.put({
          ...listen,
          genres: genres,
          genreMetadata: {
            source: source,
            lastFetched: Date.now(),
            enrichedAt: Date.now(),
            cached: true
          }
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update listen ${listen.id}:`, error);
      }
    }

    await tx.done;

    if (updated > 0) {
      console.log(`✅ Updated ${updated} listens for "${artistName}" with genres: ${genres.slice(0, 3).join(', ')}`);
    }

    return updated;

  } catch (error) {
    console.error(`Failed to update listens for ${artistName}:`, error);
    return 0;
  }
}

export async function batchUpdateListensWithGenreMap(genreMap) {
  if (!genreMap || genreMap.size === 0) {
    return { updated: 0, artists: 0 };
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔄 BATCH UPDATING LISTENS WITH GENRES`);
  console.log(`   Processing ${genreMap.size.toLocaleString()} artists...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const db = await initDB();
    const tx = db.transaction(STORES.LISTENS, 'readwrite');
    const store = tx.objectStore(STORES.LISTENS);

    const allListens = await store.getAll();

    let totalUpdated = 0;
    let artistsProcessed = 0;

    for (const [artistName, genres] of genreMap.entries()) {
      if (!genres || genres.length === 0 || genres[0] === 'Unknown') {
        continue;
      }

      const artistListens = allListens.filter(
        l => l.artistName === artistName ||
             l.track_metadata?.artist_name === artistName
      );

      for (const listen of artistListens) {
        try {
          await store.put({
            ...listen,
            genres: genres,
            genreMetadata: {
              source: 'classification',
              lastFetched: Date.now(),
              enrichedAt: Date.now(),
              cached: true
            }
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Failed to update listen ${listen.id}:`, error);
        }
      }

      artistsProcessed++;

      if (artistsProcessed % 50 === 0) {
        console.log(`   Progress: ${artistsProcessed}/${genreMap.size} artists (${totalUpdated} listens)`);
      }
    }

    await tx.done;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ BATCH UPDATE COMPLETE');
    console.log(`   Artists processed: ${artistsProcessed.toLocaleString()}`);
    console.log(`   Listens updated:   ${totalUpdated.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { updated: totalUpdated, artists: artistsProcessed };

  } catch (error) {
    console.error('Batch update failed:', error);
    return { updated: 0, artists: 0, error: error.message };
  }
}

export async function getListensNeedingGenres() {
  try {
    const db = await initDB();
    const allListens = await db.getAll(STORES.LISTENS);

    const needingGenres = allListens.filter(listen => {
      const genres = listen.genres;
      return !genres ||
             genres.length === 0 ||
             genres[0] === 'Unknown' ||
             listen.genreMetadata?.needsFetch === true;
    });

    const uniqueArtists = [...new Set(
      needingGenres
        .map(l => l.artistName)
        .filter(name => name && name !== 'Unknown Artist')
    )];

    return {
      listens: needingGenres.length,
      artists: uniqueArtists.length,
      artistList: uniqueArtists
    };

  } catch (error) {
    console.error('Failed to get listens needing genres:', error);
    return { listens: 0, artists: 0, artistList: [] };
  }
}

if (typeof window !== 'undefined') {
  window.updateListensWithGenres = updateListensWithGenres;
  window.getListensNeedingGenres = getListensNeedingGenres;

  console.log('💡 Listen updater debug tools available:');
  console.log('   - window.updateListensWithGenres(artistName, genres)');
  console.log('   - window.getListensNeedingGenres()');
}
