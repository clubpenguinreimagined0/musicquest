const VALID_GENRES = new Set([
  'electronic', 'house', 'deep house', 'tech house', 'progressive house', 'electro house',
  'techno', 'minimal techno', 'detroit techno',
  'trance', 'psytrance', 'progressive trance', 'uplifting trance',
  'dubstep', 'brostep', 'riddim',
  'drum and bass', 'jungle', 'liquid funk', 'neurofunk',
  'edm', 'big room', 'future bass', 'trap', 'melodic dubstep',
  'ambient', 'dark ambient', 'drone',
  'downtempo', 'trip hop', 'chillwave',
  'electro', 'electroclash',
  'idm', 'glitch', 'breakcore',
  'synthwave', 'outrun', 'darksynth',
  'vaporwave', 'future funk',
  'hardstyle', 'hardcore', 'gabber',

  'rock', 'classic rock', 'album rock', 'arena rock',
  'indie rock', 'indie', 'alternative rock', 'alternative', 'modern rock',
  'punk rock', 'punk', 'pop punk', 'post-punk', 'hardcore punk',
  'hard rock', 'heavy metal', 'metal', 'thrash metal', 'death metal', 'black metal',
  'progressive rock', 'prog rock', 'art rock',
  'psychedelic rock', 'psychedelic', 'acid rock',
  'garage rock', 'garage', 'surf rock',
  'grunge', 'post-grunge',
  'emo', 'screamo', 'metalcore', 'deathcore',
  'stoner rock', 'sludge metal', 'doom metal',

  'pop', 'dance-pop', 'electropop', 'synth-pop', 'synthpop',
  'indie pop', 'dream pop', 'bedroom pop',
  'art pop', 'experimental pop', 'avant-pop',
  'k-pop', 'j-pop', 'c-pop',
  'power pop', 'bubblegum pop',
  'teen pop', 'boy band', 'girl group',

  'hip hop', 'rap', 'hip-hop',
  'trap', 'trap music',
  'boom bap', 'golden age hip hop',
  'conscious hip hop', 'political hip hop',
  'underground hip hop', 'alternative hip hop',
  'gangsta rap', 'west coast hip hop', 'east coast hip hop', 'southern hip hop',
  'mumble rap', 'emo rap', 'cloud rap',
  'drill', 'grime',
  'instrumental hip hop', 'lo-fi hip hop', 'chillhop',

  'jazz',
  'bebop', 'hard bop',
  'cool jazz', 'west coast jazz',
  'free jazz', 'avant-garde jazz',
  'modal jazz', 'spiritual jazz',
  'jazz fusion', 'fusion', 'jazz-rock',
  'smooth jazz', 'contemporary jazz',
  'swing', 'big band', 'dixieland',
  'gypsy jazz', 'manouche',
  'latin jazz', 'afro-cuban jazz', 'bossa nova jazz',
  'post-bop', 'chamber jazz',
  'blues', 'delta blues', 'chicago blues', 'electric blues',
  'rhythm and blues', 'r&b', 'rnb',
  'jump blues', 'blues rock',

  'classical', 'classical music',
  'baroque', 'early music', 'renaissance',
  'classical period', 'romantic', 'romantic period',
  'contemporary classical', 'modern classical', '20th century classical',
  'minimalism', 'minimalist',
  'orchestral', 'symphonic', 'chamber music',
  'opera', 'choral', 'vocal',
  'piano', 'solo piano',

  'folk', 'traditional folk', 'contemporary folk',
  'indie folk', 'freak folk', 'psych folk',
  'americana', 'roots', 'roots rock',
  'country', 'contemporary country', 'country pop',
  'outlaw country', 'alt-country', 'alternative country',
  'bluegrass', 'old-time', 'appalachian',
  'folk rock', 'folk pop',
  'singer-songwriter', 'acoustic',

  'soul', 'southern soul', 'northern soul',
  'neo soul', 'neo-soul', 'alternative r&b',
  'funk', 'p-funk', 'g-funk',
  'disco', 'nu-disco', 'disco house',
  'motown', 'philadelphia soul',
  'quiet storm', 'contemporary r&b',

  'world', 'world music', 'world fusion', 'ethnic',
  'latin', 'latin pop', 'salsa', 'bachata', 'merengue', 'cumbia',
  'reggae', 'roots reggae', 'dub', 'dancehall', 'reggaeton',
  'ska', 'rocksteady', '2 tone',
  'afrobeat', 'afro-funk', 'highlife',
  'bossa nova', 'mpb', 'samba', 'tropicalia',
  'flamenco', 'fado', 'tango',
  'bollywood', 'indian classical', 'raga', 'hindustani', 'carnatic',
  'celtic', 'irish folk', 'scottish folk',
  'middle eastern', 'arabic', 'klezmer',
  'african', 'malian', 'congolese',

  'experimental', 'avant-garde', 'noise',
  'instrumental', 'post-rock', 'math rock',
  'lo-fi', 'lo-fi beats', 'chillout', 'chill',
  'soundtrack', 'score', 'film score', 'video game music',
  'new age', 'meditative', 'healing',
  'industrial', 'ebm', 'dark wave',
  'shoegaze', 'noise pop',
  'ska punk', 'celtic punk',
  'christian', 'gospel', 'praise', 'worship',
  'comedy', 'spoken word', 'audiobook',
  'children', 'kids music', 'lullaby'
]);

const INVALID_PATTERNS = [
  /\b(english|spanish|french|german|italian|portuguese|japanese|korean|chinese|hindi|arabic|russian|mandarin|cantonese)\b/i,
  /\b(male|female|vocalist|singer|voice|vocals)\b/i,
  /\b(american|british|canadian|australian|european|asian|african|indian)\b/i,
  /\b(60s|70s|80s|90s|2000s|2010s|2020s|sixties|seventies|eighties|nineties)\b/i,
  /\b(good|bad|popular|underground|mainstream|commercial)\b/i,
  /\b(new|old|modern|classic|contemporary)\s+(?!age|wave|jazz|classical|folk)\b/i
];

const LANGUAGE_MAPPING = {
  'hindi': 'bollywood',
  'japanese': 'j-pop',
  'korean': 'k-pop',
  'spanish': 'latin',
  'portuguese': 'latin',
  'mandarin': 'c-pop',
  'cantonese': 'c-pop'
};

const REGION_MAPPING = {
  'india': 'bollywood',
  'indian': 'indian classical',
  'china': 'c-pop',
  'japan': 'j-pop',
  'korea': 'k-pop'
};

export function validateGenre(genreTag, artistName = null) {
  if (!genreTag || typeof genreTag !== 'string') {
    return { isValid: false, reason: 'empty', suggestion: 'Unknown' };
  }

  const normalized = genreTag.toLowerCase().trim();

  if (normalized === 'unknown' || normalized === 'other' || normalized === '') {
    return { isValid: true, normalized: 'Unknown' };
  }

  if (artistName && normalized === artistName.toLowerCase()) {
    return {
      isValid: false,
      reason: 'artist_name',
      suggestion: 'Unknown',
      original: genreTag
    };
  }

  if (VALID_GENRES.has(normalized)) {
    return { isValid: true, normalized: normalized };
  }

  const languageMapped = LANGUAGE_MAPPING[normalized];
  if (languageMapped) {
    return {
      isValid: true,
      normalized: languageMapped,
      wasMapped: true,
      original: genreTag,
      mappingType: 'language'
    };
  }

  const regionMapped = REGION_MAPPING[normalized];
  if (regionMapped) {
    return {
      isValid: true,
      normalized: regionMapped,
      wasMapped: true,
      original: genreTag,
      mappingType: 'region'
    };
  }

  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isValid: false,
        reason: 'invalid_pattern',
        pattern: pattern.source,
        suggestion: 'Unknown',
        original: genreTag
      };
    }
  }

  return {
    isValid: false,
    reason: 'not_in_taxonomy',
    suggestion: 'Unknown',
    original: genreTag
  };
}

export function cleanGenreData(listens) {
  const cleanedListens = listens.map(listen => {
    const artistName = listen.artistName || listen.track_metadata?.artist_name;

    const genres = listen.genres || (listen.genre ? [listen.genre] : []);

    const validatedGenres = [];
    const metadata = {
      original: genres,
      removedCount: 0,
      mappedCount: 0,
      artistNameRemoved: false
    };

    genres.forEach(genre => {
      const validation = validateGenre(genre, artistName);

      if (validation.isValid) {
        validatedGenres.push(validation.normalized);
        if (validation.wasMapped) {
          metadata.mappedCount++;
        }
      } else {
        metadata.removedCount++;
        if (validation.reason === 'artist_name') {
          metadata.artistNameRemoved = true;
        }
      }
    });

    const finalGenres = validatedGenres.length > 0 ? validatedGenres : ['Unknown'];

    return {
      ...listen,
      genres: finalGenres,
      genre: finalGenres[0],
      genreMetadata: metadata
    };
  });

  const report = {
    total: listens.length,
    withValidGenres: cleanedListens.filter(l => !l.genres.includes('Unknown')).length,
    artistNamesRemoved: cleanedListens.filter(l => l.genreMetadata?.artistNameRemoved).length,
    languagesMapped: cleanedListens.filter(l => l.genreMetadata?.mappedCount > 0).length,
    setToUnknown: cleanedListens.filter(l => l.genres.includes('Unknown') && l.genres.length === 1).length,
    totalRemoved: cleanedListens.reduce((sum, l) => sum + (l.genreMetadata?.removedCount || 0), 0)
  };

  console.log('Genre cleanup report:', report);

  return { cleanedListens, report };
}

export function getGenreValidationStats(listens) {
  const stats = {
    totalListens: listens.length,
    genreCounts: {},
    unknownCount: 0,
    topGenres: []
  };

  listens.forEach(listen => {
    const genres = listen.genres || [listen.genre || 'Unknown'];
    genres.forEach(genre => {
      if (genre === 'Unknown') {
        stats.unknownCount++;
      }
      stats.genreCounts[genre] = (stats.genreCounts[genre] || 0) + 1;
    });
  });

  stats.topGenres = Object.entries(stats.genreCounts)
    .filter(([genre]) => genre !== 'Unknown')
    .map(([genre, count]) => ({
      name: genre,
      count: count,
      percentage: (count / stats.totalListens) * 100
    }))
    .sort((a, b) => b.count - a.count);

  return stats;
}
