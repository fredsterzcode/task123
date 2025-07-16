# RealCheck Monitor

AI-powered monitoring application for detecting AI tool usage during interviews and assessments.

## Features

- 🔍 **Real-time AI Detection**: Monitors for AI tools and suspicious behavior
- 🔐 **Secure Authentication**: Integrated with Supabase Auth
- 📱 **Cross-platform**: Windows, macOS, and Linux support
- 🛡️ **Privacy-focused**: Only monitors during authorized sessions
- 📊 **Real-time Alerts**: Instant notifications of suspicious activity

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/fredsterzcode/realcheck.git
   cd realcheck/apps/monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the monitor directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

### Build Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and recompile
- `npm run dist` - Build installers for all platforms
- `npm run dist:win` - Build Windows installer only
- `npm run dist:mac` - Build macOS installer only
- `npm run dist:linux` - Build Linux AppImage only

## Building Installers

### Windows
```bash
npm run dist:win
```
Creates: `dist-installers/RealCheck Monitor Setup.exe`

### macOS
```bash
npm run dist:mac
```
Creates: `dist-installers/RealCheck Monitor.dmg`

### Linux
```bash
npm run dist:linux
```
Creates: `dist-installers/RealCheck Monitor.AppImage`

## Architecture

```
src/
├── main.ts              # Main Electron process
├── preload.js           # Preload script for secure IPC
├── login.html           # Login page
├── main.html            # Main dashboard
├── services/
│   ├── auth.ts          # Authentication service
│   ├── monitor.ts       # Monitoring service
│   └── config.ts        # Configuration service
└── types/
    └── screenshot-desktop.d.ts  # Type definitions
```

## Security

- **Authentication**: Uses Supabase Auth for secure user authentication
- **IPC Security**: Preload scripts prevent unauthorized access to Node.js APIs
- **Data Privacy**: Only monitors during authorized sessions
- **Encryption**: All data transmitted to servers is encrypted

## Deployment

### Automatic Releases

The app uses GitHub Actions for automatic releases:

1. Create a new tag: `git tag v1.0.0`
2. Push the tag: `git push origin v1.0.0`
3. GitHub Actions will automatically build and release installers

### Manual Release

1. Build installers for all platforms
2. Create a GitHub release
3. Upload the installer files
4. Update download links in the web app

## Troubleshooting

### Common Issues

**Build fails on Windows**
- Ensure you have Visual Studio Build Tools installed
- Run `npm run postinstall` to rebuild native dependencies

**macOS code signing**
- For distribution, you'll need an Apple Developer certificate
- For development, you can run unsigned builds locally

**Linux AppImage issues**
- Ensure the AppImage is executable: `chmod +x RealCheck.AppImage`
- Some distributions may require additional dependencies

### Development Tips

- Use `npm run watch` during development for automatic recompilation
- Check the Electron DevTools for debugging renderer process
- Use `console.log` in main process for debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 