import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import "./Tooltip.css";

interface TooltipProps {
  text: string;
  children: ReactNode;
  placement?: "left" | "right";
}

type TriggerProps = {
  "aria-describedby"?: string;
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
};

export default function Tooltip({
  text,
  children,
  placement = "right",
}: TooltipProps) {
  const generatedId = useId();
  const tooltipId = `tooltip-${generatedId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissedWhileFocused, setDismissedWhileFocused] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  const visible = pinned || hovered || (focused && !dismissedWhileFocused);

  useLayoutEffect(() => {
    if (!visible || !containerRef.current || !tooltipRef.current) return;
    const triggerBounds = containerRef.current.getBoundingClientRect();
    const tooltipBounds = tooltipRef.current.getBoundingClientRect();
    const gutter = 12;
    const desiredLeft = placement === "left" ? triggerBounds.right - tooltipBounds.width : triggerBounds.left;
    setPosition({
      left: Math.max(gutter, Math.min(desiredLeft, window.innerWidth - tooltipBounds.width - gutter)),
      top: Math.max(gutter, triggerBounds.top - tooltipBounds.height - 14),
    });
  }, [placement, text, visible]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setHovered(false);
      setDismissedWhileFocused(true);
    };
    const dismissOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setPinned(false);
    };
    window.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismissOutside);
    return () => {
      window.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismissOutside);
    };
  }, [visible]);

  const child = isValidElement(children) ? children as ReactElement<TriggerProps> : null;
  const trigger = child ? cloneElement(child, {
    "aria-describedby": visible ? tooltipId : child.props["aria-describedby"],
    onClick: event => {
      child.props.onClick?.(event);
      if (!event.defaultPrevented) setPinned(value => !value);
    },
    onKeyDown: event => child.props.onKeyDown?.(event),
  }) : children;

  return (
    <span
      ref={containerRef}
      className="shared-tooltip"
      onMouseEnter={() => { setHovered(true); setDismissedWhileFocused(false); }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => { setFocused(true); setDismissedWhileFocused(false); }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          setPinned(false);
          setDismissedWhileFocused(false);
        }
      }}
    >
      {trigger}
      <span ref={tooltipRef} id={tooltipId} role="tooltip" className={`shared-tooltip__content shared-tooltip__content--${placement}${visible ? " shared-tooltip__content--visible" : ""}`} style={position}>
        {text}
        <span className="shared-tooltip__arrow" aria-hidden="true" />
      </span>
    </span>
  );
}
