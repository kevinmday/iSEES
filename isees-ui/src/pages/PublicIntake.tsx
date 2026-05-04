// ============================================================
// PublicIntake.tsx — PUBLIC OBSERVER REPORT PAGE
// Minimal, production-aligned with /report backend
// ============================================================

import { useState } from "react";

export default function PublicIntake() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [conditions, setConditions] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reportId, setReportId] = useState("");

  // ------------------------------------------------------------
  // BUILD PAYLOAD (aligned to your backend contract)
  // ------------------------------------------------------------
  function buildPayload() {
    return {
      location: location,
      description: description,
      event: {
        date_local: date || undefined,
        time_local: time || undefined,
        duration_seconds: duration ? Number(duration) : undefined,
      },
      environment: conditions
        ? {
            notes: conditions,
          }
        : undefined,
    };
  }

  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------
  async function handleSubmit() {
    if (!location || !description) {
      alert("Location and description are required.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("http://127.0.0.1:8001/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Submission failed");
      }

      setReportId(data?.report_id || "");
      setStatus("success");

      // Clear fields after success
      setLocation("");
      setDate("");
      setTime("");
      setDuration("");
      setConditions("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div
      style={{
        background: "#0b0f1a",
        color: "#e6edf3",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: 600, maxWidth: "100%" }}>
        {/* HEADER */}
        <h2 style={{ marginBottom: 10 }}>
          Report an Unusual Aerial Observation
        </h2>

        <p style={{ color: "#8b949e", marginBottom: 30 }}>
          Submit a structured observation. Reports are analyzed in real time.
        </p>

        {/* LOCATION */}
        <label style={label}>Where did this occur?</label>
        <input
          style={input}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City / region / coordinates"
        />

        {/* DATE + TIME */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Date</label>
            <input
              style={input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={label}>Time</label>
            <input
              style={input}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <label style={label}>What did you observe?</label>
        <textarea
          style={{ ...input, height: 140 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the object, movement, behavior, sound, or lack thereof..."
        />

        {/* OPTIONAL */}
        <label style={label}>How long did it last? (seconds)</label>
        <input
          style={input}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Optional"
        />

        <label style={label}>Conditions (optional)</label>
        <input
          style={input}
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="Clear sky, cloudy, night, etc."
        />

        {/* BUTTON */}
        <button
          style={{
            marginTop: 20,
            width: "100%",
            padding: "12px",
            background: "#238636",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={handleSubmit}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Submitting..." : "Submit Report"}
        </button>

        {/* STATUS */}
        {status === "success" && (
          <div style={successBox}>
            ✓ Report received
            {reportId && (
              <div style={{ marginTop: 6 }}>
                ID: <strong>{reportId}</strong>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div style={errorBox}>
            Submission failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const label = {
  display: "block",
  marginTop: 18,
  marginBottom: 6,
  fontSize: 13,
  color: "#8b949e",
};

const input = {
  width: "100%",
  padding: "10px",
  background: "#161b22",
  border: "1px solid #30363d",
  color: "#e6edf3",
};

const successBox = {
  marginTop: 20,
  padding: 12,
  background: "#12261a",
  border: "1px solid #2ea043",
};

const errorBox = {
  marginTop: 20,
  padding: 12,
  background: "#2d1111",
  border: "1px solid #f85149",
};