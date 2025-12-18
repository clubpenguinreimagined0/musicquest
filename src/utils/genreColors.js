export const genreColors = {
  'rock': '#E63946',
  'metal': '#A4161A',
  'punk': '#F72585',
  'electronic': '#FF006E',
  'edm': '#7209B7',
  'hip hop': '#FFBA08',
  'rap': '#F48C06',
  'pop': '#FFB4A2',
  'k-pop': '#FF69B4',
  'dance': '#4CC9F0',
  'jazz': '#4ECDC4',
  'blues': '#3A86FF',
  'soul': '#8338EC',
  'r&b': '#9D4EDD',
  'neo-soul': '#C77DFF',
  'ambient': '#95B8D1',
  'classical': '#6A4C93',
  'piano': '#9381FF',
  'instrumental': '#B8B8FF',
  'folk': '#99D98C',
  'indie': '#76C893',
  'alternative': '#52B69A',
  'country': '#B7B7A4',
  'acoustic': '#A5A58D',
  'latin': '#FF9F1C',
  'reggae': '#70E000',
  'world': '#FFD23F',
  'african': '#EE6C4D',
  'asian': '#FF6B9D',
  'unknown': '#495057',
  'other': '#6C757D'
};

export const getGenreColor = (genre) => {
  const normalizedGenre = genre.toLowerCase().trim();

  if (genreColors[normalizedGenre]) {
    return genreColors[normalizedGenre];
  }

  for (const [key, color] of Object.entries(genreColors)) {
    if (normalizedGenre.includes(key) || key.includes(normalizedGenre)) {
      return color;
    }
  }

  const hash = normalizedGenre.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export const getGradientStyle = (genre, type = 'stream') => {
  const color = getGenreColor(genre);

  if (type === 'stream') {
    return `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 70%, white) 100%)`;
  } else if (type === 'node') {
    return `radial-gradient(circle, ${color} 0%, color-mix(in srgb, ${color} 60%, black) 100%)`;
  }

  return color;
};

export const getUnknownGenreStyle = () => ({
  color: genreColors.unknown,
  opacity: 0.2,
  zIndex: 0
});
