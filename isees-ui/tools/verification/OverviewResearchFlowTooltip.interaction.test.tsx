// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const enterLibrary = vi.fn();
const openOrientation = vi.fn();
vi.mock("../../src/workspace/surfaces/LibraryWorkspace", () => ({ useLibraryNavigation: () => ({ enter: enterLibrary }) }));
vi.mock("../../src/guide/presentation/GuidePresentationContext", () => ({ useGuidePresentation: () => ({ openOrientation }) }));

import OverviewWorkspace, { RESEARCH_STAGES } from "../../src/workspace/surfaces/OverviewWorkspace";
import EventSpaceEvolution, { type OverviewFlowEmphasis } from "../../src/workspace/surfaces/overview/EventSpaceEvolution";
import Tooltip from "../../src/components/Tooltip";

afterEach(() => { cleanup(); vi.restoreAllMocks(); enterLibrary.mockClear(); openOrientation.mockClear(); });

const renderOverview = () => render(<MemoryRouter><OverviewWorkspace /></MemoryRouter>);
const visibleTooltip = () => screen.getAllByRole("tooltip", { hidden: true }).find(tip => tip.classList.contains("shared-tooltip__content--visible"));

describe("Overview iterative research-flow tooltips", () => {
  it("owns the five approved explanations and one concise semantic control per noninteractive row", () => {
    renderOverview();
    expect(screen.getByText("This is an iterative research cycle, not a required sequence; as governed inputs evolve, the Manifold is recomputed and may expose new research vectors.")).toBeTruthy();
    expect(RESEARCH_STAGES.map(stage => stage.tooltip)).toEqual([
      "Choose, preview, create, or resume an investigation. Library selection does not itself activate, compute, or change an investigation.",
      "Compute the Investigation Manifold from governed inputs. It is deterministic and recomputable, and may expand or reshape after approved evidence or relationship changes.",
      "Examine evidence and computed structure through different projections. Results and research vectors guide inquiry; they do not establish truth.",
      "Deliberately preserve selected research material with its identity and provenance. Preservation does not make it true, canonical, or part of the active Manifold.",
      "Create governed research products from selected material. AI may assist with drafting, but the researcher controls interpretation, meaning, and final authorship.",
    ]);
    const rows = document.querySelectorAll(".overview-flow__stages > li");
    expect(rows).toHaveLength(5);
    RESEARCH_STAGES.forEach((stage, index) => {
      const row = rows[index]!;
      expect(within(row).getAllByRole("button")).toHaveLength(1);
      expect(within(row).getByRole("button", { name: stage.tooltipLabel })).toBeTruthy();
      expect(row.hasAttribute("tabindex")).toBe(false);
      expect(row.hasAttribute("role")).toBe(false);
    });
  });

  it("exposes by hover, focus, and click; associates the trigger; and dismisses on Escape without moving focus", async () => {
    renderOverview();
    const trigger = screen.getByRole("button", { name: "About Library" });
    const wrapper = trigger.parentElement!;

    fireEvent.mouseEnter(wrapper);
    expect(visibleTooltip()?.textContent).toContain(RESEARCH_STAGES[0]!.tooltip);
    expect(trigger.getAttribute("aria-describedby")).toBe(visibleTooltip()?.id);
    fireEvent.mouseLeave(wrapper);

    trigger.focus();
    fireEvent.focusIn(trigger);
    expect(document.activeElement).toBe(trigger);
    expect(visibleTooltip()).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(visibleTooltip()).toBeUndefined();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.hasAttribute("aria-describedby")).toBe(false);

    trigger.blur();
    fireEvent.click(trigger);
    expect(visibleTooltip()).toBeTruthy();
    fireEvent.click(trigger);
    expect(visibleTooltip()).toBeUndefined();
  });

  it("uses pointer and tooltip focus only for local transient diagram emphasis", () => {
    renderOverview();
    const figure = document.querySelector(".event-space")!;
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".overview-flow__stages > li"));
    expect(figure.getAttribute("data-emphasis")).toBe("IDLE");

    RESEARCH_STAGES.forEach((stage, index) => {
      fireEvent.pointerEnter(rows[index]!);
      expect(figure.getAttribute("data-emphasis")).toBe(stage.verb);
      fireEvent.pointerLeave(rows[index]!);
      expect(figure.getAttribute("data-emphasis")).toBe("IDLE");

      const trigger = within(rows[index]!).getByRole("button");
      fireEvent.focusIn(trigger);
      expect(figure.getAttribute("data-emphasis")).toBe(stage.verb);
      fireEvent.focusOut(trigger, { relatedTarget: document.body });
      expect(figure.getAttribute("data-emphasis")).toBe("IDLE");
    });
    expect(enterLibrary).not.toHaveBeenCalled();
    expect(openOrientation).not.toHaveBeenCalled();
  });

  it("renders one accessible, non-operational explanatory image with every layer in every state", () => {
    const states: OverviewFlowEmphasis[] = ["IDLE", "SELECT", "CONSTRUCT", "EXAMINE", "PRESERVE", "PRODUCE"];
    for (const emphasis of states) {
      const view = render(<EventSpaceEvolution emphasis={emphasis} />);
      const figure = view.container.querySelector("figure")!;
      expect(figure.getAttribute("data-emphasis")).toBe(emphasis);
      expect(within(figure).getByText("Event-Space Evolution")).toBeTruthy();
      expect(within(figure).getByText("Diagrammatic explanation — not live investigation output.")).toBeTruthy();
      const image = within(figure).getByRole("img", { name: /Event-Space Evolution from governed source/ });
      expect(image.getAttribute("viewBox")).toBe("0 0 420 690");
      expect(image.getAttribute("focusable")).toBe("false");
      expect(image.querySelectorAll('[data-layer="initial-projection"], [data-layer="research-expansion"], [data-layer="governed-recomputation"]')).toHaveLength(3);
      expect(image.querySelector("desc")?.textContent).toContain("do not change Manifold membership");
      expect(image.querySelector("desc")?.textContent).toContain("Only explicit governed acceptance or admission");
      expect(figure.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
      view.unmount();
    }
  });

  it("keeps candidate domains distinct and the unavailable return path gated and conditional", () => {
    render(<EventSpaceEvolution emphasis="PRODUCE" />);
    expect(screen.getByText("CANDIDATE EVIDENCE")).toBeTruthy();
    expect(screen.getByText("KNOWLEDGE")).toBeTruthy();
    expect(screen.getByText("Noncanonical investigative directions")).toBeTruthy();
    expect(screen.getByText("Governed lifecycle — production connection not currently available.")).toBeTruthy();
    expect(screen.getByText("Deterministic recomputation after accepted eligible input.")).toBeTruthy();
    expect(document.querySelectorAll('[data-boundary="acceptance-gate"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-topology="initial"], [data-topology="revised"]')).toHaveLength(2);
  });

  it("performs no Overview operation, navigation, API activity, or history mutation", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const pushSpy = vi.spyOn(history, "pushState");
    const replaceSpy = vi.spyOn(history, "replaceState");
    renderOverview();
    const locationBefore = window.location.href;
    for (const stage of RESEARCH_STAGES) fireEvent.click(screen.getByRole("button", { name: stage.tooltipLabel }));
    expect(enterLibrary).not.toHaveBeenCalled();
    expect(openOrientation).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(locationBefore);
  });

  it("retains shared left placement compatibility used by RightPanel", () => {
    render(<Tooltip text="Unavailable explanation" placement="left"><button type="button">Metric information</button></Tooltip>);
    expect(screen.getByRole("tooltip", { hidden: true }).classList.contains("shared-tooltip__content--left")).toBe(true);
    fireEvent.focus(screen.getByRole("button", { name: "Metric information" }));
    expect(visibleTooltip()?.textContent).toContain("Unavailable explanation");
  });
});
