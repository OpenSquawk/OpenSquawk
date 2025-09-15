export type RadioOpts = {
    level?: number;   // 1..5
    voice?: string;   // z.B. "alloy"
};

export default function useRadioTTS() {
    let audio: HTMLAudioElement | null = null;

    function stop() {
        if (audio) {
            audio.pause();
            audio.src = "";
            audio.load();
            audio = null;
        }
    }

    function speakBrowser(text: string) {
        stop();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 1;
        u.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        return u;
    }

    function speakServer(text: string, opts: RadioOpts = {}) {
        stop();
        const params = new URLSearchParams({
            text,
            level: String(opts.level ?? 4),
            voice: String(opts.voice ?? "alloy"),
        });
        audio = new Audio(`/api/atc/say.stream?${params.toString()}`);
        audio.autoplay = true;
        audio.play().catch(() => {/* ignore */});
        return audio;
    }

    return { speakBrowser, speakServer, stop };
}
