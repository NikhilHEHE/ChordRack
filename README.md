# ChordRack — Vintage Analog Harmony Station

A professional-grade interactive chord progression generator with vintage analog aesthetics. Create sophisticated chord progressions using gamepad, mouse, or keyboard controls with real-time synthesis and MIDI export capabilities.

![ChordRack Interface](screenshot.png)

## 🎵 Features

### 🎹 Advanced Chord Engine
- **Diatonic Progressions**: Explore scale-based chord progressions with Roman numeral display
- **Free Mode**: Access any chord type with chromatic freedom
- **7th & 9th Extensions**: Add sophisticated jazz extensions with LB/LT buttons
- **Octave Controls**: Play in different registers with A/B buttons
- **Smart Voice Leading**: Automatic chord voicing for smooth progressions

### 🎮 Multiple Input Methods
- **Gamepad Support**: Full Xbox/PlayStation controller support
- **Mouse Control**: Click and drag on the chord wheel
- **Keyboard Shortcuts**: Complete keyboard control for desktop users
- **Real-time Switching**: Seamless input method detection

### 🎛️ Professional Synthesis
- **5 Unique Sound Presets**: From soft pads to vintage organs
- **Real-time Sound Design**: VST-style ADSR, detune, and mix controls
- **Dual-layer Synthesis**: Rich, complex timbres with octave compensation
- **Vintage Analog Aesthetic**: Professional studio equipment styling

### 📊 MIDI Integration
- **WebMIDI Output**: Connect to external DAWs and hardware
- **MIDI Recording**: Export your progressions as standard MIDI files
- **Real-time Performance**: Low-latency audio and MIDI output

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chordstack.git
   cd chordstack
   ```

2. **Start a local server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve
   
   # PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Start playing!**
   - Connect a gamepad or use mouse/keyboard
   - Hold RT/SPACE to play chords
   - Move stick/mouse to explore progressions

## 🎮 Controls

### Gamepad Controls
| Button | Function |
|--------|----------|
| **RT** | Play chords |
| **LB** | Add 7th extension |
| **LT** | Add 9th extension |
| **A** | Octave up |
| **B** | Octave down |
| **Left Stick** | Navigate chord wheel |
| **0-11 Buttons** | Root note selection (Free mode) |

### Mouse + Keyboard
| Input | Function |
|-------|----------|
| **Mouse Move** | Navigate chord wheel |
| **Mouse Click/SPACE** | Play chords |
| **SHIFT** | Add 7th extension |
| **CTRL** | Add 9th extension |
| **X** | Octave up |
| **Z** | Octave down |

### Combination Examples
- **RT + LB**: 7th chords
- **RT + LT**: Add9 chords
- **RT + LB + LT**: 7/9 chords
- **RT + A**: Chords one octave higher
- **SPACE + SHIFT + X**: 7th chords one octave up

## 🎼 Musical Modes

### Beginner Mode (Key-Locked)
- **Scale-based progressions**: Stay in key automatically
- **Roman numeral display**: See chord relationships (I, ii, V7, etc.)
- **Chord type indication**: Major, minor, diminished labels
- **Perfect for**: Learning theory, staying in key

### Free Mode
- **Chromatic freedom**: Access any chord in any key
- **Root note selection**: Choose any starting note
- **Chord type variety**: Major, minor, 7th, sus4, dim, add9
- **Perfect for**: Advanced players, modulation, jazz

## 🎛️ Sound Design

### Presets
1. **Soft Synth**: Warm, mellow pads
2. **Warm Pads**: Lush, ambient textures
3. **Bright Synth**: Clear, cutting leads
4. **Mellow Bells**: Crystalline, bell-like tones
5. **Vintage Organ**: Classic Hammond-style sounds

### Real-time Controls
- **ADSR Envelope**: Attack, Decay, Sustain, Release
- **Detune**: Pitch modulation for vintage character
- **Gain**: Overall volume control
- **Mix**: Blend between dual oscillator layers
- **Wave Types**: Sine, Triangle, Sawtooth, Square

## 📁 Project Structure

```
ChordStack/
├── index.html          # Main application interface
├── styles.css          # Vintage analog styling
├── app.js             # Core synthesis and control logic
├── favicon/           # Favicon assets
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── ...
└── README.md          # This file
```

## 🎯 Technical Features

### Audio Engine
- **Web Audio API**: Professional-quality synthesis
- **Dual-layer Oscillators**: Rich harmonic content
- **Octave Compensation**: Balanced volume across registers
- **Real-time Parameter Control**: Smooth morphing between settings

### Chord Theory
- **Diatonic Scale Construction**: Proper voice leading
- **Extension Handling**: Musically correct 7ths and 9ths
- **Chord Recognition**: Visual feedback for played chords
- **Roman Numeral Analysis**: Music theory integration

### User Experience
- **Responsive Design**: Works on desktop and tablet
- **Real-time Visual Feedback**: Color-coded chord wheel
- **Professional Aesthetics**: Vintage studio equipment design
- **Accessibility**: Multiple input methods for different users

## 🔧 Browser Requirements

- **Modern Browser**: Chrome 66+, Firefox 60+, Safari 12+, Edge 79+
- **Web Audio API**: Required for synthesis
- **Gamepad API**: For gamepad support (optional)
- **WebMIDI API**: For MIDI output (optional)

## 🎼 Musical Applications

### Composition
- **Chord Progression Discovery**: Explore harmonic relationships
- **Voice Leading Practice**: Smooth chord transitions
- **Key Modulation**: Practice changing keys
- **Jazz Harmony**: Extended chords and substitutions

### Performance
- **Live Performance**: Real-time chord triggering
- **MIDI Controller**: Send to DAWs for recording
- **Practice Tool**: Play along with backing tracks
- **Teaching Aid**: Demonstrate harmonic concepts

### Production
- **MIDI Export**: Record progressions for DAW import
- **Sound Design**: Craft custom chord sounds
- **Arrangement**: Layer different octaves and extensions
- **Demo Creation**: Quick harmonic sketching

## 🎨 Visual Design

### Vintage Analog Aesthetic
- **Professional Equipment Styling**: Inspired by classic synthesizers
- **LED Indicators**: Connection and recording status
- **Vintage Color Scheme**: Orange, amber, and green accents
- **Typography**: Custom Honk font for distinctive branding

### Chord Wheel Visualization
- **Color-coded Notes**: Tonic (orange), 3rd (amber), 5th (green)
- **Roman Numeral Display**: Music theory integration
- **Real-time Highlighting**: Visual chord feedback
- **Professional Layout**: Clean, studio-grade interface

## 🎛️ Advanced Features

### MIDI Integration
```javascript
// Connect to WebMIDI
const midiAccess = await navigator.requestMIDIAccess();
// Export recorded progressions
downloadMIDI(recordedNotes);
```

### Custom Sound Design
```javascript
// Real-time synthesis parameters
const synthParams = {
  attack: 0.02,
  decay: 0.1,
  sustain: 0.7,
  release: 0.15,
  detune: 0,
  gain: 0.5,
  mix: 0.5
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
**ChordRack** — Professional analog-style chord processor for the modern musician. 🎵✨
