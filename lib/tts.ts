"use client";

/** Gentle Web Speech API wrapper. Zero dependencies — the a11y win IS a feature. */
export class HeraldTTS {
  private voicesCached?: SpeechSynthesisVoice[];

  private pickVoice(): SpeechSynthesisVoice | undefined {
    if (!this.voicesCached || this.voicesCached.length === 0) {
      this.voicesCached = window.speechSynthesis.getVoices();
    }
    const prefer = ["Google UK English Female", "Microsoft Aria", "Google US English", "Google हिन्दी", "hi-IN"];
    for (const name of prefer) {
      const v = this.voicesCached.find((v) => v.name.includes(name));
      if (v) return v;
    }
    const anyIndian = this.voicesCached.find((v) => v.lang.startsWith("hi"));
    return anyIndian ?? this.voicesCached[0];
  }

  speak(text: string, rate = 1): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1.02;
    const v = this.pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    window.speechSynthesis.speak(u);
  }

  stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  get speaking(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking;
  }
}

export const tts = new HeraldTTS();