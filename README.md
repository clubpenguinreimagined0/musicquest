# Music Genre Evolution Visualizer

A secure, open-source React application that visualizes your music listening history with interactive D3.js timeline showing how your genre preferences evolve over time.

## Features

### Data Input
- **ListenBrainz JSON/JSONL upload**: Upload JSON or JSONL exports from [ListenBrainz](https://listenbrainz.org/settings/export/)
- **Spotify JSON/JSONL upload**: Upload extended streaming history from [Spotify](https://support.spotify.com/us/article/understanding-your-data/)
- **Multiple file upload**: Select and process multiple JSON/JSONL files simultaneously
- **Directory upload**: Upload entire directories containing JSON/JSONL files (Chrome/Edge)
- **Large file support**: Process up to 250MB of data with optimized streaming parsers
- **ListenBrainz API live fetch**: Connect directly with your ListenBrainz API token (coming soon)

### Genre Classification
- Automatic genre classification using ListenBrainz similar-artists API
- Fallback to MusicBrainz API genre tags
- Intelligent caching system to minimize API calls
- Manual genre mapping UI for unknown artists (coming soon)

### Interactive Visualizations

#### 4 Visualization Modes
1. **Sankey Flow Diagram**: Genre transitions showing flow thickness based on listening time
2. **Branching Tree Timeline**: Vertical timeline with horizontal branches for each genre
3. **Multi-track Parallel Timeline**: Concurrent genre lanes showing simultaneous listening patterns
4. **Bubble Stream**: Time-series bubbles where size represents listen count

### Time Period Grouping
- User-selectable time buckets: Daily, Weekly, Monthly, Quarterly, Yearly
- Adaptive algorithm that auto-suggests optimal grouping based on data density

### Additional Features
- Dark/Light mode toggle
- Responsive design (mobile, tablet, desktop)
- Drag-and-drop file/directory upload
- Real-time progress indicators with file-by-file tracking
- Error logging system with downloadable logs
- Secure token storage with AES-256 encryption
- IndexedDB for large dataset persistence
- Client-side only (no server required)
- JSONL streaming parser for efficient large file processing

## Installation

### Prerequisites
- Node.js 18+ or Docker

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ENCRYPTION_KEY=your-secure-encryption-key-here
```

For production, make sure to use a strong, randomly generated key.

## Usage

### Using ListenBrainz Data

1. Go to [ListenBrainz Export](https://listenbrainz.org/settings/export/)
2. Download your listening history JSON/JSONL file
3. Choose upload mode (single file, multiple files, or directory)
4. Upload the file(s) to the application (supports up to 250MB total)
5. Wait for genre classification to complete
6. Explore different visualization modes and time periods

### Using Spotify Data

1. Request your extended streaming history from [Spotify](https://support.spotify.com/us/article/understanding-your-data/)
2. Wait for Spotify to prepare your data (can take several days)
3. Download and extract the JSON files
4. Use multiple file upload or directory upload to process all streaming history files at once
5. Explore your visualizations

### Error Logs

Access error logs by clicking "View Error Logs" in the footer. The error log viewer provides:
- Real-time error tracking
- Filter by error level (error, warning, info)
- Download logs as JSON
- Clear logs functionality
- Stack traces for debugging

## Architecture

### Frontend Stack
- React 18+ with hooks
- D3.js v7+ for visualizations
- TailwindCSS for styling
- Context API for state management

### Storage
- IndexedDB for large datasets (via idb library)
- localStorage for user preferences
- Encrypted token storage (crypto-js)

### Security Features
- AES-256 encryption for sensitive data
- Client-side only (no data leaves your browser)
- Content Security Policy headers ready
- DOMPurify sanitization for user content

## Project Structure

```
src/
├── components/
│   ├── FileUpload/         # File upload with drag-and-drop
│   ├── Settings/           # Settings panel
│   └── Timeline/           # D3.js visualizations
├── hooks/
│   ├── useDataParser.js    # File parsing logic
│   └── useGenreFetch.js    # Genre classification
├── utils/
│   ├── parsers/           # ListenBrainz & Spotify parsers
│   ├── api/               # API integration with retry
│   ├── storage/           # Encryption & IndexedDB
│   ├── genreClassifier.js # Genre classification system
│   └── timePeriodGrouping.js # Time grouping algorithms
└── context/
    └── DataContext.jsx     # Global state management
```

## API Integration

### Rate Limiting
- ListenBrainz: 50 requests/second
- MusicBrainz: 1 request/second
- Automatic retry with exponential backoff

### Genre Classification Flow
1. Check cache for artist
2. Search MusicBrainz for artist MBID
3. Try ListenBrainz similar-artists API
4. Fallback to MusicBrainz genre tags
5. Cache results for 30 days

## Performance Optimizations

- React.memo for expensive components
- Debounced inputs (300ms)
- Progressive data loading
- Efficient D3.js rendering
- Responsive SVG with dynamic sizing

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Data Privacy

- All processing happens client-side
- No data sent to external servers (except API requests)
- Optional in-memory mode for session-only storage
- Encrypted token storage
- Clear data functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [ListenBrainz](https://listenbrainz.org/) for the API
- [MusicBrainz](https://musicbrainz.org/) for genre data
- [D3.js](https://d3js.org/) for visualization capabilities

## Roadmap

- [ ] ListenBrainz API live fetch integration
- [ ] Manual genre mapping UI
- [ ] Export visualizations as images
- [ ] Share visualizations via URL
- [ ] Animation playback controls
- [ ] More visualization modes
- [ ] Genre recommendations based on listening history
- [ ] Collaborative filtering insights

## Support

If you encounter any issues or have questions, please file an issue on GitHub.

## Development

Built with modern web technologies and best practices for a secure, performant, and user-friendly experience.
