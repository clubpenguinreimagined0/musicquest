# 🎵 MusicQuest

**Discover the gateway artists and genre evolution that shaped your music taste across ListenBrainz and Spotify.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-v7+-F9A03C?logo=d3.js)](https://d3js.org/)

MusicQuest is a secure, open-source visualization tool that transforms your listening history into an interactive journey through your musical evolution. Track how discovering one artist opened entire genres, visualize your taste progression over time, and uncover the hidden patterns in your music consumption.

🌄 **Built in Colorado with ❤️**

---

## ✨ Key Features

### 🎸 Gateway Artist Discovery
Identify the pivotal artists that introduced you to new genres. See how discovering Ahmad Jamal led you from bebop to hard bop, or how one electronic artist opened an entire EDM phase.

### 📊 Genre Evolution Tracking
Watch your music taste evolve with detailed subgenre tracking:
- Jazz progression: bebop → hard bop → modal jazz
- Electronic journey: house → deep house → tech house
- 200+ genre/subgenre classifications preserved

### 🔗 Multi-Platform Support
- **ListenBrainz**: Upload JSON/JSONL exports or connect via API
- **Spotify**: Import extended streaming history
- **Coming soon**: Last.fm, Apple Music

### 🎨 4 Interactive Visualization Modes
1. **Milestone Timeline**: Gateway artists with curved connectors showing genre impact
2. **Parallel Timeline**: Concurrent genre lanes with activity dots
3. **Sankey Flow**: Genre transitions with flow thickness based on listening time
4. **Stream Graph**: Smooth area charts showing genre dominance over time

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Docker
- ListenBrainz export or Spotify extended streaming history

### Local Development

```
# Clone the repository
git clone https://github.com/aldebaranshower/musicquest.git
cd musicquest

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:
```
VITE_ENCRYPTION_KEY=your-secure-encryption-key-here
```

For production, use a strong, randomly generated key.

---

## 📖 How to Use

### Option 1: ListenBrainz

1. Visit [ListenBrainz Export](https://listenbrainz.org/settings/export/)
2. Download your listening history (JSON/JSONL)
3. Upload to MusicQuest (supports up to 250MB)
4. Wait for genre classification (automatic with caching)
5. Explore your musical journey!

### Option 2: Spotify

1. Request extended streaming history from [Spotify](https://support.spotify.com/us/article/understanding-your-data/)
2. Wait for Spotify to prepare your data (3-30 days)
3. Upload all JSON files (supports multiple files or directory upload)
4. Discover your gateway artists and genre evolution

### Pro Tips
- Use **directory upload** (Chrome/Edge) for multiple Spotify files
- Enable **dark mode** for better visualization clarity
- Try different **time granularities** (yearly, quarterly, monthly) based on your data span
- Click on genres to **filter** and focus on specific musical journeys

---

## 🎯 What Makes MusicQuest Different

### Gateway Artist Attribution
Unlike other music visualizers, MusicQuest identifies **causality** in your listening patterns:

```
🎵 Discovered Ahmad Jamal (Q2 2015)
   First track: "Poinciana"
   Led to 18.5% growth in hard bop
   
   Before: bebop (45 listens)
   After:  bebop (38 listens) + hard bop (67 listens)
```

### Subgenre Precision
Most tools group "jazz" as one category. MusicQuest preserves musical nuance:
- **Separate tracking**: bebop ≠ hard bop ≠ cool jazz ≠ free jazz
- **Evolution visualization**: See your progression through subgenres
- **200+ classifications**: From brostep to chamber jazz

### Privacy-First Architecture
- **100% client-side**: All processing happens in your browser
- **No server uploads**: Your data never leaves your device
- **Encrypted storage**: AES-256 for sensitive tokens
- **Open source**: Audit the code yourself

---

## 🏗️ Architecture

### Frontend Stack
- **React 18+**: Modern hooks and Context API
- **D3.js v7+**: Interactive, responsive visualizations
- **TailwindCSS**: Clean, customizable styling
- **TypeScript**: Type-safe data handling

### Data Pipeline
```
Upload → Parse → Deduplicate → Classify → Cache → Visualize
   ↓         ↓          ↓            ↓        ↓         ↓
 JSON    Detect   Case-     ListenBrainz  IndexedDB  D3.js
         Format  Insensitive  + MusicBrainz           SVG
```

### Storage Strategy
- **IndexedDB**: Large datasets (millions of listens)
- **localStorage**: User preferences, theme, settings
- **sessionStorage**: Optional in-memory mode
- **Encrypted vault**: API tokens with crypto-js

### Performance Optimizations
- JSONL streaming parser for 250MB+ files
- Progressive genre classification (resumable)
- React.memo for expensive D3 components
- Debounced inputs and throttled renders
- Smart caching with 30-day TTL

---

## 📂 Project Structure

```
src/
├── components/
│   ├── FileUpload/           # Multi-format drag-and-drop
│   ├── GatewayArtists/       # Discovery milestone cards
│   ├── Visualizations/       # D3.js timeline modes
│   └── Settings/             # Genre cleanup, cache management
├── hooks/
│   ├── useDataParser.js      # ListenBrainz, Spotify, Last.fm parsers
│   ├── useGenreFetch.js      # API classification with retry
│   └── useTimelineLayout.js  # Collision detection, adaptive labels
├── utils/
│   ├── parsers/
│   │   ├── listenbrainz.js   # Unix timestamp handling
│   │   ├── spotify.js        # ISO to Unix conversion
│   │   └── universal.js      # Format auto-detection
│   ├── genreClassifier.js    # Taxonomy validation, mapping
│   ├── gatewayDetection.js   # Statistical causality analysis
│   └── storage/
│       ├── encryption.js     # AES-256 token vault
│       └── indexedDB.js      # Dexie.js wrapper
└── context/
    └── DataContext.jsx       # Global state, merge logic
```

---

## 🔐 Security & Privacy

### Data Protection
- ✅ Client-side only (no server infrastructure)
- ✅ AES-256 encryption for API tokens
- ✅ Content Security Policy ready
- ✅ DOMPurify sanitization
- ✅ No analytics or tracking

### API Integration
- **ListenBrainz**: 50 req/sec with exponential backoff
- **MusicBrainz**: 1 req/sec with respectful rate limiting
- **Caching**: 30-day TTL to minimize API calls
- **Retry logic**: Automatic recovery from transient failures

---

## 🎨 Visualization Gallery

### Milestone Timeline
Shows gateway artists as milestone cards connected to the timeline with curved lines. Each card displays:
- Artist name and first track
- Genre growth percentage attributed to discovery
- Time period of introduction

### Parallel Timeline
Horizontal lanes for each genre with dots representing listening activity. Larger white-outlined circles mark gateway artist discoveries.

### Sankey Flow Diagram
Flow thickness represents listen volume. Watch genres emerge, merge, and evolve over time.

### Stream Graph
Smooth, organic area chart showing genre dominance. Height = listening intensity.

---

## 🛣️ Roadmap

### In Progress
- [ ] ListenBrainz API live fetch (OAuth integration)
- [ ] Manual genre mapping UI for edge cases
- [ ] Export visualizations as PNG/SVG

### Planned Features
- [ ] Last.fm import support
- [ ] Apple Music integration
- [ ] Animation playback controls (time travel through your taste)
- [ ] Share visualizations via URL (with privacy controls)
- [ ] Genre recommendations based on gateway artist patterns
- [ ] Collaborative filtering insights ("Users who discovered X also discovered Y")
- [ ] Listening session analysis (binge vs. casual patterns)
- [ ] Decade/era comparisons (90s vs 2000s influence)

### Community Requests
Vote on features in [GitHub Discussions](https://github.com/aldebaranshower/musicquest/discussions)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear commit messages
4. **Test thoroughly**: Ensure visualizations render correctly
5. **Submit a Pull Request** with a detailed description

### Development Guidelines
- Follow React best practices (hooks, functional components)
- Use TypeScript for new features
- Write unit tests for data processing logic
- Optimize D3.js renders (avoid unnecessary re-draws)
- Document complex algorithms (especially gateway detection)

### Bug Reports
Found a bug? Please [file an issue](https://github.com/aldebaranshower/musicquest/issues) with:
- Browser and version
- Data source (ListenBrainz or Spotify)
- Steps to reproduce
- Error logs (available in Settings → View Error Logs)

---

## 📊 Technical Details

### Genre Classification Algorithm
1. **Check cache**: O(1) lookup in IndexedDB
2. **Search MusicBrainz**: Get artist MBID
3. **Query ListenBrainz**: Fetch similar artists with genre tags
4. **Fallback to MusicBrainz tags**: If ListenBrainz returns no genres
5. **Validate taxonomy**: Filter invalid tags (artist names, languages)
6. **Cache result**: 30-day TTL

### Gateway Artist Detection
Statistical analysis to identify causality:
```
For each artist discovery:
  - Calculate genre distribution 2 periods before
  - Calculate genre distribution 2 periods after
  - If genre growth > 5 percentage points
    AND artist played 10+ times in first period
    → Mark as gateway artist
```

### Deduplication Strategy
Case-insensitive key: `lowercase(track_name) + lowercase(artist_name) + timestamp`
- Handles re-uploads (50% duplicate detection)
- Merges overlapping exports (e.g., 2018-2023 + 2021-2025)
- Preserves original casing in UI

---

## 🌐 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome/Edge | 90+ | ✅ Full support including directory upload |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support (iOS 14+) |
| Opera | 76+ | ✅ Chromium-based version |

### Required Browser Features
- IndexedDB API
- Web Workers (for large file processing)
- ES2020+ JavaScript
- SVG rendering
- localStorage & sessionStorage

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

**TL;DR**: Free to use, modify, and distribute. Attribution appreciated but not required.

---

## 🙏 Acknowledgments

- **[ListenBrainz](https://listenbrainz.org/)** - Open-source music tracking API
- **[MusicBrainz](https://musicbrainz.org/)** - Comprehensive music metadata database
- **[D3.js](https://d3js.org/)** - Powerful data visualization library
- **Open source community** - For inspiration and code contributions

---

## 💬 Support & Community

- **Issues**: [GitHub Issues](https://github.com/aldebaranshower/musicquest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aldebaranshower/musicquest/discussions)
- **Documentation**: [Wiki](https://github.com/aldebaranshower/musicquest/wiki)

---

## 📸 Screenshots

*Coming soon - visualizations of real listening data*

---

## 🎯 Use Cases

### Music Enthusiasts
Discover patterns in your listening habits you never knew existed. When did your EDM phase start? What artist introduced you to jazz?

### Music Researchers
Analyze listening trends, genre evolution patterns, and discovery mechanisms with exportable data.

### Playlist Curators
Understand your audience's gateway artists to create better discovery playlists.

### Data Visualization Fans
Explore a real-world application of D3.js, React, and advanced data processing techniques.

---

**Start your musical quest today at [musicquest.dev](https://musicquest.dev)**

🌄 Crafted with care in the Colorado Rockies

---

*MusicQuest is not affiliated with ListenBrainz, Spotify, MusicBrainz, or Last.fm*
