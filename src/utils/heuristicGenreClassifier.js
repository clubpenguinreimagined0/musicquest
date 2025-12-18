const genreKeywords = {
  'Rock': ['rock', 'metal', 'punk', 'grunge', 'alternative', 'indie rock'],
  'Pop': ['pop', 'dance pop', 'synth pop', 'k-pop', 'j-pop'],
  'Hip Hop': ['rap', 'hip hop', 'trap', 'drill', 'grime'],
  'Electronic': ['edm', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'electronic'],
  'R&B': ['r&b', 'soul', 'neo soul', 'contemporary r&b'],
  'Country': ['country', 'bluegrass', 'americana'],
  'Jazz': ['jazz', 'bebop', 'swing', 'fusion'],
  'Classical': ['classical', 'orchestra', 'symphony', 'opera', 'baroque'],
  'Folk': ['folk', 'acoustic', 'singer-songwriter'],
  'Latin': ['reggaeton', 'salsa', 'bachata', 'latin', 'banda'],
  'Reggae': ['reggae', 'ska', 'dub'],
  'Blues': ['blues', 'delta blues'],
  'Funk': ['funk', 'disco'],
  'Indie': ['indie', 'lo-fi', 'bedroom pop']
};

const artistNamePatterns = {
  'DJ': ['Electronic'],
  'MC': ['Hip Hop'],
  'Lil': ['Hip Hop'],
  'Young': ['Hip Hop'],
  'The': ['Rock', 'Indie'],
  'Band': ['Rock'],
  'Orchestra': ['Classical'],
  'Quartet': ['Classical', 'Jazz'],
  'Ensemble': ['Classical'],
  'Choir': ['Classical']
};

const suffixPatterns = {
  'beats': ['Hip Hop', 'Electronic'],
  'boy': ['Hip Hop', 'Pop'],
  'girl': ['Pop'],
  'band': ['Rock'],
  'orchestra': ['Classical'],
  'ensemble': ['Classical', 'Jazz']
};

export const classifyByHeuristics = (artistName) => {
  if (!artistName || typeof artistName !== 'string') {
    return ['Unknown'];
  }

  const normalizedName = artistName.toLowerCase().trim();
  const genres = new Set();

  for (const [keyword, relatedGenres] of Object.entries(genreKeywords)) {
    if (normalizedName.includes(keyword.toLowerCase())) {
      relatedGenres.forEach(genre => genres.add(genre));
    }
  }

  const words = normalizedName.split(/\s+/);
  const firstWord = words[0] || '';
  const lastWord = words[words.length - 1] || '';

  if (artistNamePatterns[firstWord]) {
    artistNamePatterns[firstWord].forEach(genre => genres.add(genre));
  }

  for (const [suffix, relatedGenres] of Object.entries(suffixPatterns)) {
    if (lastWord.includes(suffix) || normalizedName.endsWith(suffix)) {
      relatedGenres.forEach(genre => genres.add(genre));
    }
  }

  if (normalizedName.match(/\b(ft\.|feat\.|featuring)\b/)) {
    genres.add('Hip Hop');
  }

  if (normalizedName.match(/[&+]/)) {
    genres.add('Pop');
    genres.add('R&B');
  }

  if (normalizedName.match(/\d{3,}/)) {
    genres.add('Electronic');
  }

  if (genres.size === 0) {
    return ['Unknown'];
  }

  return Array.from(genres).slice(0, 3);
};

export const getGenreConfidence = (artistName, genres) => {
  if (!genres || genres.length === 0 || genres.includes('Unknown')) {
    return 0.1;
  }

  const normalizedName = artistName.toLowerCase();
  let matchScore = 0;
  let totalPossible = 0;

  for (const [keyword, relatedGenres] of Object.entries(genreKeywords)) {
    totalPossible++;
    if (normalizedName.includes(keyword.toLowerCase())) {
      const intersection = relatedGenres.filter(g =>
        genres.some(genre => genre.toLowerCase().includes(g.toLowerCase()))
      );
      if (intersection.length > 0) {
        matchScore += intersection.length / relatedGenres.length;
      }
    }
  }

  const confidence = Math.min(matchScore / Math.max(genres.length, 1), 0.6);
  return confidence;
};

export const mergeGenres = (heuristicGenres, apiGenres) => {
  if (!apiGenres || apiGenres.length === 0 || apiGenres.includes('Unknown')) {
    return heuristicGenres;
  }

  if (!heuristicGenres || heuristicGenres.length === 0) {
    return apiGenres;
  }

  const combined = new Set([...apiGenres, ...heuristicGenres]);

  return Array.from(combined).slice(0, 3);
};
