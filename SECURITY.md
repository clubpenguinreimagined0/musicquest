# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure

1. **DO NOT** create a public GitHub issue
2. Email security details to: security@yourproject.com (replace with actual email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Fix timeline based on severity
- Credit in release notes (if desired)

## Security Best Practices for Users

### Token Storage

- Use the encrypted storage option for ListenBrainz tokens
- Never share your API tokens
- Use session-only storage for temporary use
- Clear stored data when using shared computers

### Environment Variables

```bash
# Production
VITE_ENCRYPTION_KEY=<strong-random-32-character-key>
```

Generate a strong key:
```bash
openssl rand -base64 32
```

### Browser Security

- Keep your browser updated
- Use HTTPS when deploying
- Enable Content Security Policy headers
- Review browser permissions

### Docker Security

The provided Docker configuration includes:
- Non-root user execution
- Read-only filesystem
- Security options enabled
- Health checks
- Minimal attack surface

## Security Features

### Client-Side Security

- **AES-256 Encryption**: API tokens encrypted in storage
- **DOMPurify**: Sanitizes user-generated content
- **CSP Headers**: Content Security Policy protection
- **No eval()**: No dynamic code execution
- **HTTPS Recommended**: Secure data transmission

### Data Privacy

- All processing happens client-side
- No data sent to our servers
- Optional in-memory mode
- Clear data functionality
- No tracking or analytics

### API Security

- Rate limiting on all external API calls
- Retry with exponential backoff
- Error handling without exposing internals
- CORS headers properly configured

### Dependencies

- Regular dependency updates via Dependabot
- Automated vulnerability scanning
- No known high-severity vulnerabilities

Run security audit:
```bash
npm audit
```

Fix vulnerabilities:
```bash
npm audit fix
```

## Secure Deployment

### Environment Variables

Never commit `.env` files to version control:

```gitignore
.env
.env.local
.env.production
```

### HTTPS Configuration

When deploying, always use HTTPS:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### Content Security Policy

The included nginx.conf has CSP headers. Customize as needed:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

## Known Limitations

- Browser localStorage/IndexedDB can be accessed by browser extensions
- Client-side encryption key stored in environment variable
- Rate limiting depends on API provider headers
- CORS restrictions may limit some API calls

## Security Checklist for Contributors

- [ ] No hardcoded secrets or API keys
- [ ] User input sanitized with DOMPurify
- [ ] No use of eval() or Function() constructors
- [ ] Dependencies up to date
- [ ] No SQL injection risks (all client-side)
- [ ] XSS protection implemented
- [ ] CSRF not applicable (no backend)
- [ ] Error messages don't expose internals
- [ ] Secure random number generation where needed

## Third-Party Services

This application connects to:

- **ListenBrainz API**: Public API for music listening data
- **MusicBrainz API**: Public API for music metadata
- **Labs API**: ListenBrainz experimental APIs

These are read-only operations. Review their terms of service:
- [ListenBrainz TOS](https://listenbrainz.org/terms-of-service)
- [MusicBrainz TOS](https://musicbrainz.org/doc/About/Data_License)

## Compliance

- **GDPR**: No personal data collected by this application
- **Data Retention**: User controls all data storage
- **Right to Erasure**: Clear data button provided
- **Data Portability**: Users can export their data

## Updates and Patches

Security updates will be released as:
- Patch versions for minor security fixes
- Minor versions for moderate security improvements
- Major versions for significant security changes

Subscribe to releases for notifications.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [D3.js Security](https://d3js.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.

## Contact

For security concerns: security@yourproject.com (replace with actual contact)

For general questions: Use GitHub Issues
