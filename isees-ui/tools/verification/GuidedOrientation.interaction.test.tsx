import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuidedOrientationDialog from "../../src/guide/components/GuidedOrientationDialog.tsx";

class MockUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}

const speech = { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() };

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: speech });
  Object.values(speech).forEach(mock => mock.mockClear());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const renderOrientation = (props: Partial<React.ComponentProps<typeof GuidedOrientationDialog>> = {}) => {
  const onClose = vi.fn(); const onBeginFirstInvestigation = vi.fn();
  render(<><div data-guide-id="shell.workspace-region">Workspace</div><div data-guide-id="shell.workspace-modes">Modes</div><GuidedOrientationDialog activeInvestigationId="investigation:1" workspaceContextKey="workspace:1:OVERVIEW:NORMAL" onClose={onClose} onBeginFirstInvestigation={onBeginFirstInvestigation} {...props} /></>);
  return { onClose, onBeginFirstInvestigation };
};

describe("governed iSEES orientation", () => {
  it("opens with all content available to a guest and never starts audio automatically", () => {
    renderOrientation();
    expect(screen.getByRole("dialog", { name: "iSEES Guided Orientation" })).toBeTruthy();
    expect(screen.getByText("Chapter 1 of 8")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Welcome to iSEES" })).toBeTruthy();
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it("cancels before new chapter narration and when closed", () => {
    const { onClose } = renderOrientation();
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    expect(speech.speak).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(speech.cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Exit Orientation" }).at(-1)!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(speech.cancel.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("supports pause, resume, replay, stop, and cancels on context change", () => {
    const rendered = renderOrientation();
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Replay Chapter" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(speech.pause).toHaveBeenCalledTimes(1); expect(speech.resume).toHaveBeenCalledTimes(1); expect(speech.speak).toHaveBeenCalledTimes(2);
    const before = speech.cancel.mock.calls.length;
    cleanup();
    render(<GuidedOrientationDialog activeInvestigationId="investigation:2" workspaceContextKey="workspace:2:MANIFOLD:NORMAL" onClose={rendered.onClose} onBeginFirstInvestigation={rendered.onBeginFirstInvestigation} />);
    expect(speech.cancel.mock.calls.length).toBeGreaterThan(before);
  });

  it("fails safely without speech synthesis and remains fully readable", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    renderOrientation();
    expect(screen.getByText(/Narration unavailable/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Welcome to iSEES" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Listen" })).toBeNull();
  });

  it("uses only the final existing-navigation callback", () => {
    const { onBeginFirstInvestigation, onClose } = renderOrientation();
    for (let index = 0; index < 7; index += 1) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Your First Research Mission" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Begin First Investigation" }));
    expect(onBeginFirstInvestigation).toHaveBeenCalledTimes(1); expect(onClose).toHaveBeenCalledTimes(1);
  });
});
