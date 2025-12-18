import { initDB } from './storage/indexedDB';

export async function enrichListensWithGenres(listens) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎵 GENRE ENRICHMENT STARTED`);
  console.log(`   Processing ${listens.length.toLocaleString()} listens...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let enrichedCount = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  let unknownArtists = 0;

  const db = await initDB();
  const genreCache = new Map();

  const cachedGenres = await db.getAll('genres');
  cachedGenres.forEach(entry => {
    if (entry.artist && entry.genres && entry.genres.length > 0) {
      genreCache.set(entry.artist.toLowerCase(), entry.genres);
    }
  });

  console.log(`   📚 Loaded ${genreCache.size.toLocaleString()} cached artists`);

  const enrichedListens = listens.map((listen) => {
    const artistName = listen.artistName || listen.track_metadata?.artist_name;

    if (!artistName || artistName === 'Unknown Artist') {
      unknownArtists++;
      return {
        ...listen,
        genres: ['Unknown'],
        genreMetadata: {
          source: 'unknown',
          needsFetch: false
        }
      };
    }

    const cachedGenres = genreCache.get(artistName.toLowerCase());

    if (cachedGenres && cachedGenres.length > 0 && cachedGenres[0] !== 'Unknown') {
      cacheHits++;
      enrichedCount++;
      return {
        ...listen,
        genres: cachedGenres,
        genreMetadata: {
          source: 'cache',
          cached: true,
          lastFetched: Date.now()
        }
      };
    }

    cacheMisses++;
    return {
      ...listen,
      genres: ['Unknown'],
      genreMetadata: {
        source: 'pending',
        needsFetch: true,
        cached: false
      }
    };
  });

  const enrichmentRate = listens.length > 0
    ? ((enrichedCount / listens.length) * 100).toFixed(1)
    : 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ GENRE ENRICHMENT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total listens:      ${listens.length.toLocaleString()}`);
  console.log(`   Cache hits:         ${cacheHits.toLocaleString()} (${((cacheHits/listens.length)*100).toFixed(1)}%)`);
  console.log(`   Cache misses:       ${cacheMisses.toLocaleString()} (${((cacheMisses/listens.length)*100).toFixed(1)}%)`);
  console.log(`   Unknown artists:    ${unknownArtists.toLocaleString()}`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   Enriched listens:   ${enrichedCount.toLocaleString()} (${enrichmentRate}%)`);
  console.log(`   Needs fetching:     ${cacheMisses.toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (cacheMisses > 0) {
    console.log(`💡 TIP: Run genre classification to fetch missing genres`);
  }

  return enrichedListens;
}

async function getGenresFromCache(artistName, db) {
  try {
    let cached = await db.get('genres', artistName);

    if (!cached) {
      const allGenres = await db.getAll('genres');
      cached = allGenres.find(g =>
        g.artist?.toLowerCase() === artistName.toLowerCase()
      );
    }

    if (cached && cached.genres && cached.genres.length > 0) {
      const daysSinceFetch = (Date.now() - cached.lastFetched) / (1000 * 60 * 60 * 24);

      if (daysSinceFetch > 30) {
        console.log(`   ⏰ Cache expired (${daysSinceFetch.toFixed(1)} days): ${artistName}`);
        return null;
      }

      return cached.genres;
    }

    return null;

  } catch (error) {
    console.error(`   ❌ Cache lookup failed for ${artistName}:`, error);
    return null;
  }
}

export async function getEnrichmentStats(listens) {
  const stats = {
    total: listens.length,
    enriched: 0,
    needsFetch: 0,
    unknown: 0,
    bySource: {}
  };

  listens.forEach(listen => {
    const source = listen.genreMetadata?.source || 'unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;

    if (listen.genres && listen.genres.length > 0 && listen.genres[0] !== 'Unknown') {
      stats.enriched++;
    }

    if (listen.genreMetadata?.needsFetch) {
      stats.needsFetch++;
    }

    if (listen.genres && listen.genres[0] === 'Unknown') {
      stats.unknown++;
    }
  });

  return stats;
}

export async function validateGenreCache() {
  try {
    const db = await initDB();
    const genres = await db.getAll('genres');

    const stats = {
      total: genres.length,
      valid: 0,
      invalid: 0,
      expired: 0,
      issues: []
    };

    genres.forEach(entry => {
      if (!entry.artist || !entry.genres) {
        stats.invalid++;
        stats.issues.push({
          artist: entry.artist || 'unknown',
          issue: 'Missing artist or genres field'
        });
        return;
      }

      const daysSinceFetch = (Date.now() - entry.lastFetched) / (1000 * 60 * 60 * 24);
      if (daysSinceFetch > 30) {
        stats.expired++;
        return;
      }

      stats.valid++;
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 GENRE CACHE VALIDATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total entries:    ${stats.total.toLocaleString()}`);
    console.log(`   Valid:            ${stats.valid.toLocaleString()}`);
    console.log(`   Expired:          ${stats.expired.toLocaleString()}`);
    console.log(`   Invalid:          ${stats.invalid.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (stats.issues.length > 0) {
      console.log(`   Issues found (first 5):`);
      stats.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.artist}: ${issue.issue}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return stats;

  } catch (error) {
    console.error('Failed to validate genre cache:', error);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.validateGenreCache = validateGenreCache;
  window.getEnrichmentStats = async () => {
    const { initDB } = await import('./storage/indexedDB.js');
    const db = await initDB();
    const listens = await db.getAll('listens');
    return getEnrichmentStats(listens);
  };

  console.log('💡 Genre enrichment debug tools available:');
  console.log('   - window.validateGenreCache()');
  console.log('   - window.getEnrichmentStats()');
}
