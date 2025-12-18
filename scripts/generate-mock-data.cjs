const fs = require('fs');
const path = require('path');

const artists = [
  { name: 'The Beatles', genres: ['rock', 'pop', 'classic rock'] },
  { name: 'Miles Davis', genres: ['jazz', 'bebop', 'cool jazz'] },
  { name: 'Daft Punk', genres: ['electronic', 'house', 'dance'] },
  { name: 'Radiohead', genres: ['alternative rock', 'experimental', 'art rock'] },
  { name: 'Kendrick Lamar', genres: ['hip hop', 'rap', 'west coast hip hop'] },
  { name: 'Taylor Swift', genres: ['pop', 'country', 'indie pop'] },
  { name: 'Led Zeppelin', genres: ['rock', 'hard rock', 'blues rock'] },
  { name: 'Billie Eilish', genres: ['pop', 'alternative', 'indie'] },
  { name: 'Pink Floyd', genres: ['progressive rock', 'psychedelic rock', 'art rock'] },
  { name: 'Drake', genres: ['hip hop', 'rap', 'r&b'] },
  { name: 'Nirvana', genres: ['grunge', 'alternative rock', 'punk'] },
  { name: 'Adele', genres: ['pop', 'soul', 'r&b'] },
  { name: 'David Bowie', genres: ['rock', 'glam rock', 'art rock'] },
  { name: 'Queen', genres: ['rock', 'progressive rock', 'hard rock'] },
  { name: 'Bob Dylan', genres: ['folk', 'rock', 'country'] }
];

const tracks = [
  'Come Together', 'Yesterday', 'Hey Jude', 'Let It Be', 'Help!',
  'So What', 'Blue in Green', 'Freddie Freeloader', 'All Blues',
  'One More Time', 'Around the World', 'Get Lucky', 'Harder Better Faster Stronger',
  'Creep', 'Karma Police', 'No Surprises', 'Fake Plastic Trees',
  'HUMBLE.', 'Alright', 'DNA.', 'LOVE.',
  'Shake It Off', 'Blank Space', 'Love Story', 'You Belong With Me',
  'Stairway to Heaven', 'Whole Lotta Love', 'Kashmir', 'Black Dog',
  'bad guy', 'when the party\'s over', 'bury a friend', 'ocean eyes',
  'Comfortably Numb', 'Wish You Were Here', 'Time', 'Money',
  'God\'s Plan', 'In My Feelings', 'Hotline Bling', 'One Dance'
];

const albums = [
  'Abbey Road', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Revolver',
  'Kind of Blue', 'Sketches of Spain', 'Birth of the Cool',
  'Discovery', 'Homework', 'Random Access Memories',
  'OK Computer', 'The Bends', 'Kid A',
  'good kid, m.A.A.d city', 'To Pimp a Butterfly', 'DAMN.',
  '1989', 'Red', 'Fearless',
  'Led Zeppelin IV', 'Physical Graffiti', 'Houses of the Holy',
  'When We All Fall Asleep, Where Do We Go?', 'Happier Than Ever',
  'The Dark Side of the Moon', 'The Wall', 'Animals',
  'Views', 'Scorpion', 'Take Care'
];

function generateListenBrainzData(count) {
  const listens = [];
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    const randomTime = now - Math.random() * oneYear;

    listens.push({
      listened_at: Math.floor(randomTime / 1000),
      track_metadata: {
        artist_name: randomArtist.name,
        track_name: randomTrack,
        release_name: randomAlbum,
        additional_info: {
          recording_mbid: generateUUID(),
          artist_mbids: [generateUUID()]
        }
      },
      recording_msid: generateUUID()
    });
  }

  listens.sort((a, b) => b.listened_at - a.listened_at);

  return listens;
}

function generateSpotifyData(count) {
  const listens = [];
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    const randomTime = now - Math.random() * oneYear;
    const msPlayed = Math.floor(30000 + Math.random() * 300000);

    listens.push({
      ts: new Date(randomTime).toISOString(),
      master_metadata_track_name: randomTrack,
      master_metadata_album_artist_name: randomArtist.name,
      master_metadata_album_album_name: randomAlbum,
      ms_played: msPlayed,
      spotify_track_uri: `spotify:track:${generateRandomString(22)}`,
      reason_start: 'trackdone',
      reason_end: 'trackdone'
    });
  }

  listens.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  return listens;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const args = process.argv.slice(2);
const type = args[0] || 'listenbrainz';
const count = parseInt(args[1]) || 1000;

console.log(`Generating ${count} ${type} listens...`);

let data;
let filename;

if (type === 'spotify') {
  data = generateSpotifyData(count);
  filename = `sample-data/spotify-${count}.json`;
} else {
  data = generateListenBrainzData(count);
  filename = `sample-data/listenbrainz-${count}.json`;
}

const outputPath = path.join(__dirname, '..', filename);
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`Generated ${filename} with ${data.length} listens`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
