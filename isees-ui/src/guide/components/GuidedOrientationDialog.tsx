import { useCallback, useEffect, useRef, useState } from "react";
import { GOVERNED_ORIENTATION_V1 } from "../registry/GovernedOrientationV1.ts";
import { GuideNarrationController, type GuideNarrationStatus } from "../presentation/GuideNarrationController.ts";
import GuideSpotlight from "./GuideSpotlight.tsx";

const SESSION_KEY = "isees.guided-orientation.v1.progress";

interface Props {
  readonly activeInvestigationId?: string;
  readonly workspaceContextKey: string;
  readonly onClose: () => void;
  readonly onBeginFirstInvestigation: () => void;
}

function initialChapterIndex(): number {
  try {
    const value = window.sessionStorage.getItem(SESSION_KEY);
    if (!value) return 0;
    const stored = JSON.parse(value) as { activeChapterId?: string };
    const index = GOVERNED_ORIENTATION_V1.chapters.findIndex(chapter => chapter.chapterId === stored.activeChapterId);
    return index < 0 ? 0 : index;
  } catch { return 0; }
}

export default function GuidedOrientationDialog({ activeInvestigationId, workspaceContextKey, onClose, onBeginFirstInvestigation }: Props) {
  const [chapterIndex, setChapterIndex] = useState(initialChapterIndex);
  const [narrationStatus, setNarrationStatus] = useState<GuideNarrationStatus>("IDLE");
  const [targetFailure, setTargetFailure] = useState<string>();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [controller] = useState(() => new GuideNarrationController());
  const chapter = GOVERNED_ORIENTATION_V1.chapters[chapterIndex];
  const isFinal = chapterIndex === GOVERNED_ORIENTATION_V1.chapters.length - 1;

  const close = useCallback(() => { controller.stop(); onClose(); }, [controller, onClose]);
  const changeChapter = useCallback((nextIndex: number) => {
    controller.stop();
    setTargetFailure(undefined);
    setChapterIndex(nextIndex);
  }, [controller]);

  useEffect(() => controller.subscribe(setNarrationStatus), [controller]);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); controller.stop(); };
  }, [close, controller]);
  useEffect(() => { controller.stop(); }, [activeInvestigationId, workspaceContextKey, controller]);
  useEffect(() => {
    const completionState = isFinal ? "COMPLETE" : chapterIndex === 0 ? "NOT_STARTED" : "IN_PROGRESS";
    try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ orientationId: GOVERNED_ORIENTATION_V1.orientationId, definitionVersion: GOVERNED_ORIENTATION_V1.definitionVersion, activeChapterId: chapter.chapterId, completionState })); } catch { /* session persistence is optional */ }
  }, [chapter.chapterId, chapterIndex, isFinal]);

  return <div className="isees-orientation-backdrop">
    <div ref={dialogRef} className="isees-orientation" role="dialog" aria-modal="true" aria-labelledby="isees-orientation-title" aria-describedby="isees-orientation-summary" tabIndex={-1}>
      <header className="isees-orientation__header">
        <div><p>Governed first-contact orientation</p><h2 id="isees-orientation-title">{GOVERNED_ORIENTATION_V1.title}</h2></div>
        <button type="button" aria-label="Exit Orientation" onClick={close}>×</button>
      </header>
      <div className="isees-orientation__body">
        <div className="isees-orientation__progress" aria-label={`Chapter ${chapterIndex + 1} of ${GOVERNED_ORIENTATION_V1.chapters.length}`}>
          <span>Chapter {chapterIndex + 1} of {GOVERNED_ORIENTATION_V1.chapters.length}</span>
          <progress value={chapterIndex + 1} max={GOVERNED_ORIENTATION_V1.chapters.length} />
        </div>
        <div className="sr-only" aria-live="polite">Chapter {chapterIndex + 1}: {chapter.title}</div>
        <article key={chapter.chapterId} className="isees-orientation__chapter">
          <h3>{chapter.title}</h3>
          <p id="isees-orientation-summary" className="isees-orientation__summary">{chapter.summary}</p>
          <div className="isees-orientation__transcript" tabIndex={-1}>{chapter.visibleTranscript.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        </article>
        {chapter.interfaceTargetId && <GuideSpotlight targetId={chapter.interfaceTargetId} onMissing={message => setTargetFailure(message)} onRemoved={() => undefined} />}
        {targetFailure && <p className="isees-guide-panel__target-failure" role="status">{targetFailure}</p>}
        <section className="isees-orientation__boundaries" aria-label="Orientation authority boundaries"><p>{GOVERNED_ORIENTATION_V1.authorityBoundary}</p><p>{GOVERNED_ORIENTATION_V1.advisoryBoundary}</p></section>
      </div>
      <footer className="isees-orientation__footer">
        <div className="isees-orientation__audio" aria-label="Chapter narration controls">
          {narrationStatus === "UNAVAILABLE" ? <span role="status">Narration unavailable in this browser. The complete transcript remains available.</span> : <>
            <button type="button" onClick={() => controller.listen(chapter.spokenTranscript)} disabled={narrationStatus !== "IDLE"}>Listen</button>
            <button type="button" onClick={() => controller.listen(chapter.spokenTranscript)}>Replay Chapter</button>
            <button type="button" onClick={() => controller.pause()} disabled={narrationStatus !== "PLAYING"}>Pause</button>
            <button type="button" onClick={() => controller.resume()} disabled={narrationStatus !== "PAUSED"}>Resume</button>
            <button type="button" onClick={() => controller.stop()} disabled={narrationStatus === "IDLE"}>Stop</button>
          </>}
          <button type="button" onClick={() => { controller.stop(); dialogRef.current?.querySelector<HTMLElement>(".isees-orientation__transcript")?.focus(); }}>Read Instead</button>
        </div>
        <div className="isees-orientation__navigation">
          <button type="button" onClick={() => changeChapter(chapterIndex - 1)} disabled={!chapter.previousChapterId}>Previous</button>
          {!isFinal && <button type="button" className="is-primary" onClick={() => changeChapter(chapterIndex + 1)}>Next</button>}
          {isFinal && <button type="button" className="is-primary" onClick={() => { controller.stop(); onBeginFirstInvestigation(); onClose(); }}>Begin First Investigation</button>}
          <button type="button" onClick={close}>Exit Orientation</button>
        </div>
      </footer>
    </div>
  </div>;
}
