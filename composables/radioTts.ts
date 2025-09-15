// audioRadioTTS.ts
/** AUDIO: English TTS with radio ambience (noise + bandlimit + PTT click) **/
declare const cfg:
    | { value?: { tts?: boolean } }
    | undefined; // optional global (Nuxt/Pinia o.ä.)

let _ctx: AudioContext | null = null;
let _masterGain: GainNode;
let _noiseGain: GainNode;
let _noiseFilterBand: BiquadFilterNode;
let _noiseFilterHP: BiquadFilterNode;
let _noiseFilterLP: BiquadFilterNode;
let _compressor: DynamicsCompressorNode;

function ensureAudioGraph() {
    if (_ctx) return;
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    _masterGain = _ctx.createGain();
    _masterGain.gain.value = 0.9;

    // Background "radio" noise
    const noiseBuffer = _ctx.createBuffer(1, _ctx.sampleRate * 2, _ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (data[i - 1] || 0) * 0.97 + w * 0.03; // cheap pink-ish
    }
    const noise = _ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    _noiseFilterHP = _ctx.createBiquadFilter();
    _noiseFilterHP.type = "highpass";
    _noiseFilterHP.frequency.value = 300;

    _noiseFilterBand = _ctx.createBiquadFilter();
    _noiseFilterBand.type = "bandpass";
    _noiseFilterBand.frequency.value = 1600;
    _noiseFilterBand.Q.value = 0.6;

    _noiseFilterLP = _ctx.createBiquadFilter();
    _noiseFilterLP.type = "lowpass";
    _noiseFilterLP.frequency.value = 3200;

    _compressor = _ctx.createDynamicsCompressor();
    _compressor.threshold.value = -24;
    _compressor.knee.value = 20;
    _compressor.ratio.value = 6;
    _compressor.attack.value = 0.003;
    _compressor.release.value = 0.1;

    _noiseGain = _ctx.createGain();
    _noiseGain.gain.value = 0.07;

    noise
        .connect(_noiseFilterHP)
        .connect(_noiseFilterBand)
        .connect(_noiseFilterLP)
        .connect(_noiseGain)
        .connect(_compressor)
        .connect(_masterGain)
        .connect(_ctx.destination);

    noise.start();
}

function pttClick(durationMs = 25, gain = 0.5) {
    if (!_ctx) return;
    const osc = _ctx.createOscillator();
    const g = _ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1200 + Math.random() * 600;
    g.gain.value = gain;
    osc.connect(g).connect(_masterGain);
    osc.start();
    const now = _ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.stop(now + durationMs / 1000 + 0.02);
}

/** Helpers */
function isTtsEnabled(): boolean {
    // Wenn cfg fehlt → default: true (nicht crashen, trotzdem sprechen)
    try {
        // @ts-ignore – cfg evtl. global
        const val = (cfg as any)?.value?.tts;
        return val ?? true;
    } catch {
        return true;
    }
}

/** Main speak with radio ambience */
export default function speak(text: string) {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    if (!isTtsEnabled()) return;

    ensureAudioGraph();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; // or "en-GB"
    u.rate = 1.0;
    u.pitch = 1.0;

    u.onstart = () => {
        _ctx?.resume();
        pttClick(18, 0.35);
        if (_noiseGain) {
            const now = _ctx!.currentTime;
            _noiseGain.gain.cancelScheduledValues(now);
            _noiseGain.gain.setValueAtTime(_noiseGain.gain.value, now);
            _noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        }
    };

    u.onend = () => {
        pttClick(22, 0.28);
        if (_noiseGain) {
            const now = _ctx!.currentTime;
            _noiseGain.gain.cancelScheduledValues(now);
            _noiseGain.gain.setValueAtTime(_noiseGain.gain.value, now);
            _noiseGain.gain.linearRampToValueAtTime(0.07, now + 0.2);
        }
    };

    setTimeout(() => {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    }, 60);
}


export function createRadioTTS(isEnabled: () => boolean = () => true) {
    return (text: string) => {
        if (!isEnabled()) return;
        speak(text);
    };
}
// usage: const speakRadio = createRadioTTS(() => cfg?.value?.tts ?? true);
