// ---------- Configuration & data ----------
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MAJOR = [0,2,4,5,7,9,11];
const MINOR = [0,2,3,5,7,8,10];
const FLAVORS = [
  {name:'Triad', intervals:[0,4,7]},
  {name:'7th', intervals:[0,4,7,10]},
  {name:'sus4', intervals:[0,5,7]},
  {name:'add9', intervals:[0,4,7,14]}
];
const FREE_CHORDS = { major:[0,4,7], minor:[0,3,7], maj7:[0,4,7,11], '7':[0,4,7,10], sus4:[0,5,7], add9:[0,4,7,14], dim:[0,3,6], min7:[0,3,7,10] };

const DEADZONE = 0.15;             // reduced deadzone for better responsiveness
const BASE_OCTAVE = 5;             // playback octave (sensible audible range)
const TPQ = 480;                   // MIDI ticks per quarter

// ---------- UI refs ----------
const modeSelect = document.getElementById('modeSelect');
const rootSelect = document.getElementById('rootSelect');
const scaleSelect = document.getElementById('scaleSelect');
const soundSelect = document.getElementById('soundSelect');
const legacyChk = document.getElementById('legacyChk');
const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn = document.getElementById('stopRecBtn');
const connectMidiBtn = document.getElementById('connectMidiBtn');
const gpLed = document.getElementById('gpLed');
const mLed = document.getElementById('mLed');
const recLed = document.getElementById('recLed');
const chordNameEl = document.getElementById('chordName');
const statusEl = document.getElementById('status');
const debugEl = document.getElementById('debug');
const wheel = document.getElementById('wheel');
const wctx = wheel.getContext('2d');

// Mouse and keyboard state
let mouseX = 0, mouseY = 0;
let mouseDown = false;
let keyboardState = {
  space: false,  // RT (play chords)
  shift: false,  // LB (7th)
  ctrl: false,   // LT (9th) 
  x: false,      // A (octave up)
  z: false       // B (octave down)
};

// Synth control refs
const waveType = document.getElementById('waveType');
const attackSlider = document.getElementById('attackSlider');
const decaySlider = document.getElementById('decaySlider');
const sustainSlider = document.getElementById('sustainSlider');
const releaseSlider = document.getElementById('releaseSlider');
const detuneSlider = document.getElementById('detuneSlider');
const gainSlider = document.getElementById('gainSlider');
const mixSlider = document.getElementById('mixSlider');
const resetSynthBtn = document.getElementById('resetSynthBtn');

// Value display elements
const attackValue = document.getElementById('attackValue');
const decayValue = document.getElementById('decayValue');
const sustainValue = document.getElementById('sustainValue');
const releaseValue = document.getElementById('releaseValue');
const detuneValue = document.getElementById('detuneValue');
const gainValue = document.getElementById('gainValue');
const mixValue = document.getElementById('mixValue');

// fill root keys
NOTE_NAMES.forEach((n,i)=>{ const o=document.createElement('option'); o.value=i; o.text=n; rootSelect.appendChild(o); });
rootSelect.value = 0; // default C

// Initialize synth controls
function initSynthControls() {
  // Update value displays in real-time
  function updateValues() {
    attackValue.textContent = attackSlider.value;
    decayValue.textContent = decaySlider.value;
    sustainValue.textContent = sustainSlider.value;
    releaseValue.textContent = releaseSlider.value;
    detuneValue.textContent = detuneSlider.value;
    gainValue.textContent = gainSlider.value;
    mixValue.textContent = mixSlider.value;
  }

  // Add event listeners for real-time updates
  [attackSlider, decaySlider, sustainSlider, releaseSlider, detuneSlider, gainSlider, mixSlider].forEach(slider => {
    slider.addEventListener('input', updateValues);
  });

  // Load preset values into controls
  soundSelect.addEventListener('change', () => {
    loadPresetToControls(soundSelect.value);
  });

  // Reset button
  resetSynthBtn.addEventListener('click', () => {
    loadPresetToControls(soundSelect.value);
  });

  updateValues();
}

// Load preset values into the control sliders
function loadPresetToControls(presetName) {
  const preset = SOUND_PRESETS[presetName];
  if (!preset || !preset.layers.length) return;

  const layer1 = preset.layers[0];
  waveType.value = layer1.type;
  attackSlider.value = Math.round(layer1.attack * 1000);
  releaseSlider.value = Math.round(layer1.release * 1000);
  detuneSlider.value = layer1.detune || 0;
  gainSlider.value = Math.round(layer1.gain * 100);
  
  // Set defaults for controls not in presets
  decaySlider.value = 100;
  sustainSlider.value = 70;
  mixSlider.value = preset.layers[1] ? 50 : 0;

  // Update displays
  attackValue.textContent = attackSlider.value;
  decayValue.textContent = decaySlider.value;
  sustainValue.textContent = sustainSlider.value;
  releaseValue.textContent = releaseSlider.value;
  detuneValue.textContent = detuneSlider.value;
  gainValue.textContent = gainSlider.value;
  mixValue.textContent = mixSlider.value;
}

// Get current synth parameters from controls
function getCurrentSynthParams() {
  return {
    waveType: waveType.value,
    attack: parseFloat(attackSlider.value) / 1000,
    decay: parseFloat(decaySlider.value) / 1000,
    sustain: parseFloat(sustainSlider.value) / 100,
    release: parseFloat(releaseSlider.value) / 1000,
    detune: parseFloat(detuneSlider.value),
    gain: parseFloat(gainSlider.value) / 100,
    mix: parseFloat(mixSlider.value) / 100
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSynthControls();
  loadPresetToControls('piano');
  
  // Initial wheel draw after a short delay to ensure canvas is ready
  setTimeout(() => {
    drawWheel(getScale(parseInt(rootSelect.value,10),'major'), -1, []);
  }, 100);
  
  // Sound design panel is already collapsed in HTML
  // Arrow starts as ▼ (down) when collapsed - no rotation needed
});

// Mouse and keyboard event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Mouse events for the wheel canvas
  wheel.addEventListener('mousemove', (e) => {
    const rect = wheel.getBoundingClientRect();
    const centerX = wheel.width / 2;
    const centerY = wheel.height / 2;
    
    // Convert mouse position to canvas coordinates
    mouseX = ((e.clientX - rect.left) / rect.width) * wheel.width - centerX;
    mouseY = ((e.clientY - rect.top) / rect.height) * wheel.height - centerY;
    
    // Normalize to gamepad-like coordinates (-1 to 1)
    mouseX = mouseX / (wheel.width / 2);
    mouseY = mouseY / (wheel.height / 2);
  });
  
  wheel.addEventListener('mousedown', (e) => {
    e.preventDefault();
    mouseDown = true;
  });
  
  wheel.addEventListener('mouseup', (e) => {
    e.preventDefault();
    mouseDown = false;
  });
  
  wheel.addEventListener('mouseleave', () => {
    mouseDown = false;
  });
  
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        keyboardState.space = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keyboardState.shift = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        keyboardState.ctrl = true;
        break;
      case 'KeyX':
        keyboardState.x = true;
        break;
      case 'KeyZ':
        keyboardState.z = true;
        break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch(e.code) {
      case 'Space':
        keyboardState.space = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keyboardState.shift = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        keyboardState.ctrl = false;
        break;
      case 'KeyX':
        keyboardState.x = false;
        break;
      case 'KeyZ':
        keyboardState.z = false;
        break;
    }
  });
});

// Toggle sound design controls visibility
function toggleSynthControls() {
  const synthContent = document.getElementById('synthControlsContent');
  const synthArrow = document.getElementById('synthDropdownArrow');
  
  synthContent.classList.toggle('collapsed');
  synthArrow.classList.toggle('rotated');
}

// Debug: Check if recording buttons exist
console.log('Start button found:', startRecBtn);
console.log('Stop button found:', stopRecBtn);
console.log('Status element found:', statusEl);

// ---------- Audio / synth ----------
let audioCtx = null;
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
let activeVoices = [];  // {osc,gain, midi}
function noteToFreq(m){ return 440 * Math.pow(2,(m-69)/12); }
function midiFromPC(pc, octave=BASE_OCTAVE){ return 12*octave + (pc % 12); }

// Sound presets for different synthesis types
const SOUND_PRESETS = {
  piano: {
    name: 'Soft Synth',
    layers: [
      { type: 'triangle', detune: 0, gain: 0.15, attack: 0.02, release: 0.4 },
      { type: 'sine', detune: 3, gain: 0.08, attack: 0.05, release: 0.6 }
    ]
  },
  warm: {
    name: 'Warm Pads', 
    layers: [
      { type: 'sawtooth', detune: 0, gain: 0.05, attack: 1.2, release: 2.0 },
      { type: 'sawtooth', detune: -7, gain: 0.04, attack: 1.5, release: 2.2 },
      { type: 'triangle', detune: 12, gain: 0.03, attack: 1.8, release: 2.5 },
      { type: 'sine', detune: 5, gain: 0.025, attack: 2.0, release: 3.0 }
    ]
  },
  bright: {
    name: 'Bright Synth',
    layers: [
      { type: 'sawtooth', detune: 0, gain: 0.08, attack: 0.005, release: 0.12 },
      { type: 'square', detune: 12, gain: 0.04, attack: 0.01, release: 0.08 },
      { type: 'sawtooth', detune: 7, gain: 0.03, attack: 0.008, release: 0.10 }
    ]
  },
  mellow: {
    name: 'Mellow Bells',
    layers: [
      { type: 'sine', detune: 0, gain: 0.12, attack: 0.08, release: 3.5 },
      { type: 'sine', detune: 12, gain: 0.06, attack: 0.12, release: 2.8 },
      { type: 'sine', detune: 19, gain: 0.04, attack: 0.15, release: 4.0 },
      { type: 'triangle', detune: 24, gain: 0.02, attack: 0.20, release: 5.0 }
    ]
  },
  vintage: {
    name: 'Vintage Organ',
    layers: [
      { type: 'square', detune: 0, gain: 0.10, attack: 0.001, release: 0.05 },
      { type: 'square', detune: 12, gain: 0.06, attack: 0.001, release: 0.05 },
      { type: 'sawtooth', detune: 7, gain: 0.04, attack: 0.002, release: 0.08 },
      { type: 'square', detune: 19, gain: 0.03, attack: 0.001, release: 0.06 },
      { type: 'sine', detune: 0, gain: 0.02, attack: 0.001, release: 0.10 }
    ]
  }
};

// Enhanced synthesis engine with custom controls
function startVoices(midiNotes){
  ensureAudio(); stopVoices();
  const now = audioCtx.currentTime;
  const params = getCurrentSynthParams();
  
  activeVoices = [];
  midiNotes.forEach((m,i)=>{
    const voiceOscillators = [];
    const voiceGains = [];
    
    // Calculate octave compensation for volume
    // Lower octaves need more gain, higher octaves need less
    const octave = Math.floor(m / 12);
    const baseOctave = 5; // BASE_OCTAVE
    const octaveDiff = octave - baseOctave;
    // Boost lower octaves, reduce higher octaves (clamped to reasonable range)
    const clampedDiff = Math.max(-2, Math.min(2, octaveDiff)); // Limit to ±2 octaves compensation
    const octaveGainMultiplier = Math.pow(1.4, -clampedDiff);
    
    // Layer 1 - Main oscillator
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    osc1.type = params.waveType;
    osc1.frequency.setValueAtTime(noteToFreq(m) * Math.pow(2, params.detune/1200), now);
    gain1.gain.setValueAtTime(0.0001, now);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    // ADSR Envelope with octave compensation
    const peakGain = params.gain * octaveGainMultiplier;
    const sustainLevel = peakGain * params.sustain;
    
    gain1.gain.linearRampToValueAtTime(peakGain, now + params.attack);
    gain1.gain.linearRampToValueAtTime(sustainLevel, now + params.attack + params.decay);
    
    osc1.start();
    voiceOscillators.push(osc1);
    voiceGains.push(gain1);
    
    // Layer 2 - Secondary oscillator (if mix > 0)
    if (params.mix > 0) {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      
      // Use complementary waveform for richness
      const layer2Wave = params.waveType === 'sine' ? 'triangle' : 'sine';
      osc2.type = layer2Wave;
      osc2.frequency.setValueAtTime(noteToFreq(m) * Math.pow(2, (params.detune + 3)/1200), now); // +3 cents detune
      gain2.gain.setValueAtTime(0.0001, now);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      // Layer 2 envelope with mix level and octave compensation
      const peakGain2 = params.gain * params.mix * 0.6 * octaveGainMultiplier;
      const sustainLevel2 = peakGain2 * params.sustain;
      
      gain2.gain.linearRampToValueAtTime(peakGain2, now + params.attack);
      gain2.gain.linearRampToValueAtTime(sustainLevel2, now + params.attack + params.decay);
      
      osc2.start();
      voiceOscillators.push(osc2);
      voiceGains.push(gain2);
    }
    
    activeVoices.push({
      oscillators: voiceOscillators,
      gains: voiceGains,
      midi: m,
      params: params
    });
  });
}
function morphVoices(newMidis){
  ensureAudio();
  if(activeVoices.length === newMidis.length){
    const now = audioCtx.currentTime;
    const params = getCurrentSynthParams();
    
    for(let i=0;i<newMidis.length;i++){
      try {
        const voice = activeVoices[i];
        voice.oscillators.forEach((osc, oscIdx) => {
          if(osc) {
            const detuneOffset = oscIdx === 1 ? 3 : 0; // Layer 2 gets +3 cents
            const newFreq = noteToFreq(newMidis[i]) * Math.pow(2, (params.detune + detuneOffset)/1200);
            osc.frequency.exponentialRampToValueAtTime(newFreq, now+0.08);
          }
        });
        voice.midi = newMidis[i];
      } catch(e){}
    }
  } else {
    startVoices(newMidis);
  }
}

function stopVoices(){
  if(!audioCtx) return;
  const now = audioCtx.currentTime;
  const params = getCurrentSynthParams();
  
  activeVoices.forEach(voice=>{
    try{
      voice.gains.forEach((gain) => {
        if(gain) {
          gain.gain.cancelScheduledValues(now); 
          gain.gain.exponentialRampToValueAtTime(0.0001, now + params.release);
        }
      });
      voice.oscillators.forEach((osc) => {
        if(osc) {
          osc.stop(now + params.release);
        }
      });
    } catch(e){}
  });
  activeVoices = [];
}

// ---------- MIDI recording ----------
let recording = false;
let recStart = 0;
let recEvents = []; // {type:'on'|'off', note, time(ms), vel}
function recordOn(notes, vel=100){
  if(!recording) return;
  const t = Math.round(performance.now() - recStart);
  notes.forEach(n => recEvents.push({type:'on', note:n, time:t, vel}));
}
function recordOff(notes){
  if(!recording) return;
  const t = Math.round(performance.now() - recStart);
  notes.forEach(n => recEvents.push({type:'off', note:n, time:t, vel:0}));
}
function writeVarLen(value){
  const bytes=[];
  let buffer = value & 0x7F;
  value >>= 7;
  while(value){
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  bytes.push(buffer);
  return bytes;
}
function buildMidiFromEvents(events, opts={tpq:TPQ, tempo:500000}){
  const tpq = opts.tpq, tempo = opts.tempo;
  const ticksPerMs = tpq / (tempo/1000);
  events.sort((a,b)=>a.time-b.time);
  let lastTick = 0;
  let data = [];
  data.push(...writeVarLen(0)); data.push(0xFF,0x51,0x03, (tempo>>16)&0xFF,(tempo>>8)&0xFF,tempo&0xFF);
  data.push(...writeVarLen(0)); data.push(0xC0,0x00);
  for(const ev of events){
    const tick = Math.round(ev.time * ticksPerMs);
    const delta = Math.max(0, tick - lastTick);
    data.push(...writeVarLen(delta));
    if(ev.type==='on') data.push(0x90, ev.note & 0x7F, ev.vel & 0x7F);
    else data.push(0x80, ev.note & 0x7F, ev.vel & 0x7F);
    lastTick = tick;
  }
  data.push(...writeVarLen(0)); data.push(0xFF,0x2F,0x00);
  const header = [0x4D,0x54,0x68,0x64, 0,0,0,6, 0,0, 0,1, (TPQ>>8)&0xFF, TPQ&0xFF];
  const trackLen = data.length;
  const trackHeader = [0x4D,0x54,0x72,0x6B, (trackLen>>24)&0xFF,(trackLen>>16)&0xFF,(trackLen>>8)&0xFF, trackLen&0xFF];
  return new Uint8Array([...header, ...trackHeader, ...data]).buffer;
}

// ---------- wheel drawing with colored tonic/3rd/5th ----------
function drawWheel(scalePCs, activeIdx, activeChordPCs=[]){
  wctx.clearRect(0,0,wheel.width,wheel.height);
  const cx = wheel.width/2, cy = wheel.height/2;
  const outerRadius = Math.min(cx,cy) - 20;
  const innerRadius = 60;
  const sliceAngle = (Math.PI * 2) / scalePCs.length;
  
  // Vintage analog equipment background with brushed metal effect
  const bgGradient = wctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
  bgGradient.addColorStop(0, '#2a2a2a');    // Dark metal center
  bgGradient.addColorStop(0.3, '#1a1a1a');  // Darker metal
  bgGradient.addColorStop(0.7, '#0f0f0f');  // Almost black
  bgGradient.addColorStop(1, '#000000');    // Pure black edge
  wctx.fillStyle = bgGradient;
  wctx.fillRect(0, 0, wheel.width, wheel.height);
  
  // Add subtle brushed metal texture
  wctx.save();
  wctx.globalAlpha = 0.1;
  for(let i = 0; i < 100; i++){
    wctx.strokeStyle = i % 2 ? '#444' : '#333';
    wctx.lineWidth = 0.5;
    wctx.beginPath();
    wctx.moveTo(0, i * 4);
    wctx.lineTo(wheel.width, i * 4);
    wctx.stroke();
  }
  wctx.restore();
  
  // Draw each slice with vintage VU meter styling
  for(let i = 0; i < scalePCs.length; i++){
    const startAngle = (i * sliceAngle) - Math.PI/2;
    const endAngle = ((i + 1) * sliceAngle) - Math.PI/2;
    const midAngle = startAngle + sliceAngle/2;
    
    // Vintage analog equipment colors
    let isActive = false;
    let glowColor = '#444';
    let fillColor = '#2a2a2a';
    let noteType = 'inactive';

    // Check for chord matches when RT button is held (activeChordPCs has notes)
    if(activeChordPCs && activeChordPCs.length > 0){
      const pc = scalePCs[i] % 12;
      const tonic = activeChordPCs[0] % 12;
      const third = (activeChordPCs[1] !== undefined) ? (activeChordPCs[1] % 12) : null;
      const fifth = (activeChordPCs[2] !== undefined) ? (activeChordPCs[2] % 12) : null;
      
      const pcNormalized = ((pc % 12) + 12) % 12;
      const tonicNormalized = ((tonic % 12) + 12) % 12;
      const thirdNormalized = third !== null ? ((third % 12) + 12) % 12 : null;
      const fifthNormalized = fifth !== null ? ((fifth % 12) + 12) % 12 : null;
      
      if(pcNormalized === tonicNormalized) {
        isActive = true;
        noteType = 'tonic';
        glowColor = '#ff6b35';  // Warm orange for tonic (vintage amp glow)
        fillColor = '#ff8c65';  // Lighter orange
      } else if(thirdNormalized !== null && pcNormalized === thirdNormalized) {
        isActive = true;
        noteType = 'third';
        glowColor = '#ffbf00';  // Amber LED color for third
        fillColor = '#ffd633';  // Lighter amber
      } else if(fifthNormalized !== null && pcNormalized === fifthNormalized) {
        isActive = true;
        noteType = 'fifth';
        glowColor = '#4caf50';  // Green LED for fifth
        fillColor = '#66bb6a';  // Lighter green
      }
    } else if(activeIdx >= 0) {
      // Simple selection highlighting when not holding RT button
      if(i === activeIdx) {
        isActive = true;
        noteType = 'selected';
        glowColor = '#ff6b35';  // Warm orange for selected note
        fillColor = '#ff8c65';  // Lighter orange
      }
    }
    
    // Create slice path
    wctx.beginPath();
    wctx.arc(cx, cy, outerRadius, startAngle, endAngle);
    wctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    wctx.closePath();
    
    if(isActive) {
      // Simple active slice fill - bright but no inner glow effects
      const activeGradient = wctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
      activeGradient.addColorStop(0, fillColor + 'CC');  // Bright center  
      activeGradient.addColorStop(0.5, fillColor + 'AA'); // Medium brightness
      activeGradient.addColorStop(1, fillColor + '88');   // Dimmer edge
      wctx.fillStyle = activeGradient;
      wctx.fill();
      
      console.log(`🔵 ACTIVE SLICE: ${NOTE_NAMES[scalePCs[i] % 12]} - fillColor=${fillColor}, noteType=${noteType}`);
      
      // Use consistent, subtle intensity for all active notes
      const baseIntensity = 1.2; // Fixed subtle intensity for clean neon look
      
      console.log(`  RENDERING GLOW: ${NOTE_NAMES[scalePCs[i] % 12]} - intensity=${baseIntensity.toFixed(2)}, glowColor=${glowColor}, noteType=${noteType}`);

    } else {
      // Inactive slice with brushed metal look
      const inactiveGradient = wctx.createLinearGradient(cx-outerRadius, cy-outerRadius, cx+outerRadius, cy+outerRadius);
      inactiveGradient.addColorStop(0, '#3a3a3a');  // Light metal
      inactiveGradient.addColorStop(0.5, '#2a2a2a'); // Medium metal
      inactiveGradient.addColorStop(1, '#1a1a1a');   // Dark metal
      wctx.fillStyle = inactiveGradient;
      wctx.fill();
    }
    
    // Vintage equipment style borders
    wctx.strokeStyle = isActive ? glowColor + 'CC' : '#555';
    wctx.lineWidth = isActive ? 2 : 1;
    wctx.stroke();
    
    // Note label with vintage equipment font styling
    const labelRadius = (outerRadius + innerRadius) / 2;
    const labelX = cx + Math.cos(midAngle) * labelRadius;
    const labelY = cy + Math.sin(midAngle) * labelRadius;
    
    // Roman numerals positioned closer to center for better readability
    const romanRadius = innerRadius + 15; // Even closer to center
    const romanX = cx + Math.cos(midAngle) * romanRadius;
    const romanY = cy + Math.sin(midAngle) * romanRadius;
    
    // Roman numerals for chord degrees - consistent uppercase format
    const currentScale = scaleSelect.value; // Get current scale (major/minor)
    const majorRomanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const minorRomanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    
    const romanNumeral = currentScale === 'major' ? majorRomanNumerals[i] : minorRomanNumerals[i];
    const noteName = NOTE_NAMES[scalePCs[i] % 12];
    
    wctx.save();
    wctx.fillStyle = isActive ? '#ffffff' : '#ccc';
    wctx.font = isActive ? 'bold 15px Arial' : '13px Arial';
    wctx.textAlign = 'center';
    wctx.textBaseline = 'middle';
    
    if(isActive) {
      // Vintage LED-style text glow for note name
      wctx.shadowColor = glowColor;
      wctx.shadowBlur = 6;
      wctx.fillText(noteName, labelX, labelY);
      
      // Second glow layer
      wctx.shadowBlur = 12;
      wctx.fillText(noteName, labelX, labelY);
      
      // Sharp core text for note name
      wctx.shadowBlur = 0;
      wctx.fillStyle = '#ffffff';
      wctx.fillText(noteName, labelX, labelY);
      
      // Roman numeral closer to center with glow
      wctx.shadowColor = glowColor;
      wctx.shadowBlur = 6;
      wctx.font = isActive ? 'bold 14px Arial' : '12px Arial';
      wctx.fillStyle = isActive ? '#ffcc88' : '#aaa';
      wctx.fillText(romanNumeral, romanX, romanY);
      
      // Second glow layer for roman numeral
      wctx.shadowBlur = 12;
      wctx.fillText(romanNumeral, romanX, romanY);
      
      // Sharp core text for roman numeral
      wctx.shadowBlur = 0;
      wctx.fillStyle = '#ffcc88';
      wctx.fillText(romanNumeral, romanX, romanY);
    } else {
      // Inactive text - note name at normal position
      wctx.fillText(noteName, labelX, labelY);
      
      // Roman numeral closer to center for inactive state
      wctx.font = '12px Arial';
      wctx.fillStyle = '#aaa';
      wctx.fillText(romanNumeral, romanX, romanY);
    }
    
    wctx.restore();
  }
  
  // Center circle with vintage analog equipment styling
  const centerGradient = wctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
  centerGradient.addColorStop(0, '#4a4a4a');  // Light metal center
  centerGradient.addColorStop(0.3, '#3a3a3a'); // Medium metal
  centerGradient.addColorStop(0.7, '#2a2a2a'); // Dark metal
  centerGradient.addColorStop(1, '#1a1a1a');   // Darkest edge
  
  wctx.beginPath();
  wctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  wctx.fillStyle = centerGradient;
  wctx.fill();
  
  // Center border with vintage metallic accent
  wctx.strokeStyle = '#666';
  wctx.lineWidth = 2;
  wctx.stroke();
  
  // Add subtle inner shadow for depth
  wctx.save();
  wctx.strokeStyle = '#222';
  wctx.lineWidth = 1;
  wctx.stroke();
  wctx.restore();
}

// ---------- utility ----------
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// ---------- gamepad & mapping (legacy axis from first working variant) ----------
let gpIndex = null;
let axisX = 0, axisY = 1; // not used for legacy mapping, but harmless
let invertX=false, invertY=false;
let playing=false, lastPlayed=[];

// legacy mapping: x = axes[0], y = axes[1] (no inversion)
function readLegacy(gp){
  const rawX = (gp.axes[0] !== undefined) ? gp.axes[0] : 0;
  const rawY = (gp.axes[1] !== undefined) ? gp.axes[1] : 0;
  return {rawX, rawY, adjX: rawX, adjY: rawY}; // no Y inversion to fix directional mapping
}

// mapping used in the very first variant - fixed for proper continuous movement
function mapFirstVariant(adjX, adjY, scale){
  // Based on gamepad test code: adjX = right/left, adjY = down/up (inverted)
  // We want: up -> C (top), right -> D/E, down -> F/G, left -> A/B
  // Since adjY is inverted (positive = down), we need to flip it
  // Since directions are mirrored, we also need to flip X
  
  // Calculate angle using standard math coordinates (-adjX = right, -adjY = up)
  let angle = Math.atan2(-adjY, -adjX); // -adjX to fix mirroring, -adjY to convert gamepad coords to math coords
  
  // Rotate by -π/2 to align stick up with wheel top (C)
  angle = angle - Math.PI/2;
  
  // Normalize to 0-2π range
  if (angle < 0) angle += 2 * Math.PI;
  
  // Map angle to scale degree
  const degree = Math.floor((angle / (2 * Math.PI)) * scale.length) % scale.length;
  
  // Map magnitude to flavors (use distance from center for flavor selection)
  const magnitude = Math.hypot(adjX, adjY);
  const flavorFloat = magnitude * FLAVORS.length;
  const flavor = Math.min(Math.floor(flavorFloat), FLAVORS.length - 1);
  
  return {degree, flavor};
}

// free-mode mapping - fixed for smooth circular movement
function mapFreeFirst(adjX, adjY){
  // Use the same coordinate system as beginner mode
  let angle = Math.atan2(-adjY, -adjX); // -adjX to fix mirroring, -adjY to convert gamepad coords to math coords
  
  // Rotate by -π/2 to align stick up with wheel top
  angle = angle - Math.PI/2;
  
  // Normalize angle to 0-2π range
  if (angle < 0) angle += 2 * Math.PI;
  
  // Define chord positions around a circle (8 positions)
  const chords = ['major', 'sus4', 'add9', 'maj7', 'minor', 'dim', '7', 'min7'];
  const segmentSize = (2 * Math.PI) / chords.length;
  const chordIndex = Math.floor(angle / segmentSize) % chords.length;
  
  return chords[chordIndex] || 'major';
}

// diatonic helpers
function getScale(rootIdx, scaleName){ const base = (scaleName==='major')?MAJOR:MINOR; return base.map(s => (s + rootIdx) % 12); }

function buildDiatonicPCs(scalePCs, degree, flavorIdx, add7th = false, add9th = false){ 
  // Get the root note from the scale
  const rootPC = scalePCs[degree]; 
  
  // Build chord by taking scale degrees: root (0), third (2), fifth (4)
  const chordPCs = [
    scalePCs[degree % 7],                    // root (1st)
    scalePCs[(degree + 2) % 7],              // third (3rd) 
    scalePCs[(degree + 4) % 7]               // fifth (5th)
  ];
  
  // Add 7th if requested (7th scale degree)
  if (add7th) {
    chordPCs.push(scalePCs[(degree + 6) % 7]); // 7th
  }
  
  // Add 9th if requested (2nd scale degree, octave up)
  if (add9th) {
    const ninth = scalePCs[(degree + 1) % 7];
    chordPCs.push(ninth + 12); // 9th (2nd an octave up)
  }
  
  // Sort the notes and apply octave voicing
  let voicedNotes = [...chordPCs];
  
  // Ensure proper octave spacing - if a note is lower than previous, bump it up an octave
  for (let i = 1; i < voicedNotes.length; i++) {
    while (voicedNotes[i] <= voicedNotes[i-1]) {
      voicedNotes[i] += 12;
    }
  }
  
  return voicedNotes;
}

function buildFreePCs(rootPC, flavor){ const ints = FREE_CHORDS[flavor] || FREE_CHORDS.major; return ints.map(iv => rootPC + iv); }

// main poll loop
function poll(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let usingGamepad = false;
  let gp = null;
  
  // Check for gamepad first
  if(pads && gpIndex === null){ 
    for(let i=0;i<pads.length;i++){ 
      if(pads[i]){ 
        gpIndex = i; 
        gpLed.classList.add('on'); 
        statusEl.textContent = 'Gamepad connected'; 
        break; 
      } 
    } 
  }
  
  gp = pads[gpIndex];
  if(gp){
    usingGamepad = true;
  } else {
    // No gamepad, use mouse/keyboard
    gpLed.classList.remove('on');
    if(gpIndex !== null) {
      statusEl.textContent = 'Using mouse + keyboard';
      gpIndex = null; // Reset gamepad index
    }
  }

  // Get input values (either from gamepad or mouse/keyboard)
  let rawX=0, rawY=0, adjX=0, adjY=0;
  let hold = false, add7th = false, add9th = false, octaveUp = false, octaveDown = false;
  
  if(usingGamepad) {
    // read axes using legacy or calibrated (but we default to legacy)
    const legacy = legacyChk.checked;
    if(legacy){
      const r = readLegacy(gp); rawX = r.rawX; rawY = r.rawY; adjX = r.adjX; adjY = r.adjY;
    } else {
      // fallback: calibrated axes (if implemented). for now use same legacy mapping if not calibrated.
      const r = readLegacy(gp); rawX = r.rawX; rawY = r.rawY; adjX = r.adjX; adjY = r.adjY;
    }
    
    // Get button states from gamepad
    hold = !!(gp.buttons[7] && gp.buttons[7].pressed);
    add7th = !!(gp.buttons[4] && gp.buttons[4].pressed);
    add9th = !!(gp.buttons[6] && gp.buttons[6].pressed);
    octaveUp = !!(gp.buttons[0] && gp.buttons[0].pressed);
    octaveDown = !!(gp.buttons[1] && gp.buttons[1].pressed);
  } else {
    // Use mouse position and keyboard buttons
    rawX = mouseX; rawY = mouseY; adjX = mouseX; adjY = mouseY;
    
    // Get button states from keyboard
    hold = mouseDown || keyboardState.space;
    add7th = keyboardState.shift;
    add9th = keyboardState.ctrl;
    octaveUp = keyboardState.x;
    octaveDown = keyboardState.z;
  }

  const mag = Math.hypot(adjX, adjY);

  // choose mode
  if(modeSelect.value === 'beginner'){
    const rootIdx = parseInt(rootSelect.value,10);
    const scale = getScale(rootIdx, scaleSelect.value);
    if(mag < DEADZONE){
      drawWheel(scale, -1, []);
      chordNameEl.textContent = '-';
      statusEl.textContent = '-';
      if(playing){ stopVoices(); recordOff(lastPlayed); playing=false; lastPlayed=[]; }
    } else {
      const {degree, flavor} = mapFirstVariant(adjX, adjY, scale);
      
      // Determine correct chord type based on scale degree
      const scaleName = scaleSelect.value;
      let chordType;
      if (scaleName === 'major') {
        const majorChordTypes = ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'];
        chordType = majorChordTypes[degree % majorChordTypes.length];
      } else {
        const minorChordTypes = ['minor', 'diminished', 'Major', 'minor', 'minor', 'Major', 'Major'];
        chordType = minorChordTypes[degree % minorChordTypes.length];
      }
      
      chordNameEl.textContent = NOTE_NAMES[scale[degree]] + ' ' + chordType;
      statusEl.textContent = `Degree:${degree} Type:${chordType}`;
      
      // Calculate octave shift
      let octaveShift = 0;
      if (octaveUp) octaveShift += 1;
      if (octaveDown) octaveShift -= 1;
      
      const pcs = buildDiatonicPCs(scale, degree, flavor, add7th, add9th);
      
      // Update chord name to show extensions
      let extendedChordName = NOTE_NAMES[scale[degree]] + ' ' + chordType;
      if (add7th) extendedChordName += '7';
      if (add9th) extendedChordName += add7th ? '/9' : 'add9';
      
      // Add octave indicator to chord name
      if (octaveShift > 0) extendedChordName += ` (+${octaveShift} oct)`;
      if (octaveShift < 0) extendedChordName += ` (${octaveShift} oct)`;
      
      chordNameEl.textContent = extendedChordName;
      
      // Update status to show extensions and octave
      let statusText = `Degree:${degree} Type:${chordType}`;
      if (add7th || add9th) {
        statusText += ' Extensions:';
        if (add7th) statusText += ' 7th';
        if (add9th) statusText += ' 9th';
      }
      if (octaveShift !== 0) {
        statusText += ` Octave:${octaveShift > 0 ? '+' : ''}${octaveShift}`;
      }
      statusEl.textContent = statusText;
      
      // Convert to MIDI notes with proper octave handling including user octave shift
      const midis = pcs.map(pc => {
        const octaveOffset = Math.floor(pc / 12);
        return midiFromPC(pc % 12, BASE_OCTAVE + octaveOffset + octaveShift);
      });
      
      // Always show chord highlighting when RT button is held, regardless of which note we're pointing at
      if(hold){
        // Draw with chord highlighting - show all notes including extensions
        const highlightPCs = pcs.slice(0, add9th ? 5 : (add7th ? 4 : 3));
        drawWheel(scale, degree, highlightPCs);
        
        if(!playing){
          startVoices(midis); recordOn(midis); playing=true; lastPlayed=midis.slice();
        } else {
          // morph
          morphVoices(midis); lastPlayed=midis.slice();
        }
      } else {
        // Draw without chord highlighting when not holding A
        drawWheel(scale, degree, []);
        if(playing){ stopVoices(); recordOff(lastPlayed); playing=false; lastPlayed=[]; }
      }
    }
  } else { // free mode
    // root override via buttons (0..11) - only for gamepad
    let rootIdx = parseInt(rootSelect.value,10);
    if(usingGamepad) {
      for(let i=0;i<Math.min(gp.buttons.length,12); i++){ if(gp.buttons[i].pressed){ rootIdx = i; rootSelect.value = i; break; } }
    }
    const rootPC = rootIdx % 12;
    if(mag < DEADZONE){
      drawWheel(getScale(rootIdx,'major'), -1, []);
      chordNameEl.textContent = '-';
      statusEl.textContent = '-';
      if(playing){ stopVoices(); recordOff(lastPlayed); playing=false; lastPlayed=[]; }
    } else {
      const chordKey = mapFreeFirst(adjX, adjY);
      const pcs = buildFreePCs(rootPC, chordKey);
      
      // Calculate octave shift (using unified variables)
      let octaveShift = 0;
      if (octaveUp) octaveShift += 1;
      if (octaveDown) octaveShift -= 1;
      
      // compute midi notes (keep octave logic: root octave BASE_OCTAVE + octave shift)
      const midis = pcs.map(pc => {
        const octaveOffset = Math.floor(pc / 12);
        return midiFromPC(pc % 12, BASE_OCTAVE + octaveOffset + octaveShift);
      });
      
      // Update chord name with octave indicator
      let chordName = NOTE_NAMES[rootPC] + ' ' + chordKey;
      if (octaveShift > 0) chordName += ` (+${octaveShift} oct)`;
      if (octaveShift < 0) chordName += ` (${octaveShift} oct)`;
      chordNameEl.textContent = chordName;
      drawWheel(getScale(rootIdx,'major'), 0, pcs.slice(0,3));
      if(hold){
        if(!playing){ startVoices(midis); recordOn(midis); playing=true; lastPlayed=midis.slice(); }
        else { morphVoices(midis); lastPlayed=midis.slice(); }
      } else {
        if(playing){ stopVoices(); recordOff(lastPlayed); playing=false; lastPlayed=[]; }
      }
    }
  }

  // debug output
  debugEl.textContent = `rawX:${rawX.toFixed(2)} rawY:${rawY.toFixed(2)} adjX:${adjX.toFixed(2)} adjY:${adjY.toFixed(2)} hold:${hold} input:${usingGamepad ? 'gamepad' : 'mouse+kb'}`;
  requestAnimationFrame(poll);
}
requestAnimationFrame(poll);

// ---------- WebMIDI (optional) ----------
let midiAccess = null, midiOut = null;
connectMidiBtn.addEventListener('click', async ()=>{
  if(!navigator.requestMIDIAccess){ alert('WebMIDI not supported in this browser.'); return; }
  try{
    midiAccess = await navigator.requestMIDIAccess();
    const outs = Array.from(midiAccess.outputs.values());
    if(outs.length){ midiOut = outs[0]; mLed.classList.add('on'); statusEl.textContent = 'WebMIDI connected'; }
    else statusEl.textContent = 'No MIDI outputs found';
    midiAccess.onstatechange = ()=>{};
  } catch(e){ alert('MIDI error: '+e); }
});

// ---------- Recording controls ----------
startRecBtn.addEventListener('click', ()=>{
  console.log('Start recording button clicked');
  recording = true; recEvents = []; recStart = performance.now(); 
  startRecBtn.disabled = true; stopRecBtn.disabled = false; 
  recLed.classList.add('recording');
  statusEl.textContent = 'Recording...';
});
stopRecBtn.addEventListener('click', ()=>{
  console.log('Stop recording button clicked');
  recording = false; startRecBtn.disabled = false; stopRecBtn.disabled = true; 
  recLed.classList.remove('recording');
  statusEl.textContent = 'Building MIDI...';
  if(recEvents.length === 0){ alert('No events recorded'); statusEl.textContent='No events'; return; }
  const buf = buildMidiFromEvents(recEvents);
  const blob = new Blob([buf], {type:'audio/midi'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'hichord_session.mid'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  statusEl.textContent = 'MIDI ready for download.';
});

// quick helper to start with beginner
modeSelect.value = 'beginner';
drawWheel(getScale(parseInt(rootSelect.value,10),'major'), -1, []);

// that's it
