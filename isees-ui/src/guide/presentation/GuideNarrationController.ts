export type GuideNarrationStatus = "UNAVAILABLE" | "IDLE" | "PLAYING" | "PAUSED";

export class GuideNarrationController {
  private status: GuideNarrationStatus;
  private listener?: (status: GuideNarrationStatus) => void;
  private readonly speech: SpeechSynthesis | undefined;

  constructor(speech: SpeechSynthesis | undefined = typeof window === "undefined" ? undefined : window.speechSynthesis) {
    this.speech = speech;
    this.status = speech && typeof SpeechSynthesisUtterance !== "undefined" ? "IDLE" : "UNAVAILABLE";
  }

  getStatus(): GuideNarrationStatus { return this.status; }
  subscribe(listener: (status: GuideNarrationStatus) => void): () => void {
    this.listener = listener;
    listener(this.status);
    return () => { if (this.listener === listener) this.listener = undefined; };
  }

  listen(transcript: string): void {
    if (!this.speech || this.status === "UNAVAILABLE") return;
    this.speech.cancel();
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.onend = () => this.setStatus("IDLE");
    utterance.onerror = () => this.setStatus("IDLE");
    this.speech.speak(utterance);
    this.setStatus("PLAYING");
  }

  pause(): void {
    if (!this.speech || this.status !== "PLAYING") return;
    this.speech.pause();
    this.setStatus("PAUSED");
  }

  resume(): void {
    if (!this.speech || this.status !== "PAUSED") return;
    this.speech.resume();
    this.setStatus("PLAYING");
  }

  stop(): void {
    if (!this.speech || this.status === "UNAVAILABLE") return;
    this.speech.cancel();
    this.setStatus("IDLE");
  }

  private setStatus(status: GuideNarrationStatus): void {
    this.status = status;
    this.listener?.(status);
  }
}
