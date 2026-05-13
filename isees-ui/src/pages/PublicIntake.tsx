// ============================================================
// PublicIntake.tsx — PUBLIC OBSERVER REPORT PAGE
// EMERGENCE GEOMETRY ACQUISITION LAYER
// DEMO MODE READY
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";

export default function PublicIntake() {

  // ----------------------------------------------------------
  // CORE OBSERVATION
  // ----------------------------------------------------------

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [duration, setDuration] = useState("");
  const [conditions, setConditions] = useState("");

  const [description, setDescription] = useState("");

  // ----------------------------------------------------------
  // EMERGENCE GEOMETRY
  // ----------------------------------------------------------

  const [shape, setShape] = useState("");
  const [movement, setMovement] = useState("");
  const [sound, setSound] = useState("");
  const [lighting, setLighting] = useState("");
  const [observerMode, setObserverMode] = useState("");
  const [witnessCount, setWitnessCount] = useState("");

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [reportId, setReportId] = useState("");

  // ----------------------------------------------------------
  // BUILD PAYLOAD
  // ----------------------------------------------------------

  function buildPayload() {

    return {

      location: location,

      description: description,

      event: {

        date_local:
          date || undefined,

        time_local:
          time || undefined,

        duration_seconds:
          duration
            ? Number(duration)
            : undefined,
      },

      environment:
        conditions
          ? {
              notes: conditions,
            }
          : undefined,

      emergence: {

        morphology: {
          shape:
            shape || undefined,
        },

        behavior: {
          movement:
            movement || undefined,
        },

        acoustics: {
          sound:
            sound || undefined,
        },

        appearance: {
          lighting:
            lighting || undefined,
        },

        observer: {

          mode:
            observerMode || undefined,

          witness_count:
            witnessCount
              ? Number(witnessCount)
              : undefined,
        },
      },
    };
  }

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  async function handleSubmit() {

    if (!location || !description) {

      alert(
        "Location and observation description are required."
      );

      return;
    }

    setStatus("sending");

    try {

      const res = await fetch(
        "http://127.0.0.1:8001/report",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            buildPayload()
          ),
        }
      );

      const data = await res.json();

      if (!res.ok) {

        throw new Error(
          data?.detail ||
          "Submission failed"
        );
      }

      setReportId(
        data?.report_id || ""
      );

      setStatus("success");

      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      setLocation("");
      setDate("");
      setTime("");

      setDuration("");
      setConditions("");

      setDescription("");

      setShape("");
      setMovement("");
      setSound("");
      setLighting("");

      setObserverMode("");
      setWitnessCount("");

    } catch (err) {

      console.error(err);

      setStatus("error");
    }
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (

    <div
      style={{
        background: "#0b0f1a",

        color: "#e6edf3",

        minHeight: "100vh",

        display: "flex",

        justifyContent: "center",

        padding: "40px 20px",

        fontFamily:
          "system-ui, sans-serif",
      }}
    >

      <div
        style={{
          width: 760,
          maxWidth: "100%",
        }}
      >

        {/* HEADER */}

        <h2
          style={{
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Structured Observation Intake
        </h2>

        <p
          style={{
            color: "#8b949e",

            marginBottom: 30,

            textAlign: "center",

            lineHeight: 1.5,
          }}
        >
          Submit a structured observation.
          Reports are normalized and analyzed
          through the iSEES emergence pipeline
          in real time.
        </p>

        {/* LOCATION */}

        <label style={label}>
          Observation Location
        </label>

        <input
          style={input}

          value={location}

          onChange={(e) =>
            setLocation(
              e.target.value
            )
          }

          placeholder="City / region / coordinates"
        />

        {/* DATE + TIME */}

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >

          {/* DATE */}

          <div style={{ flex: 1 }}>

            <label style={label}>
              Date
            </label>

            <input
              style={input}

              type="date"

              value={date}

              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
            />
          </div>

          {/* TIME */}

          <div style={{ flex: 1 }}>

            <label style={label}>
              Time
            </label>

            <input
              style={input}

              type="text"

              value={time}

              onChange={(e) =>
                setTime(
                  e.target.value
                )
              }

              placeholder="Approximate local time"
            />

            <div
              style={{
                marginTop: 6,

                color: "#6e7681",

                fontSize: 12,
              }}
            >
              Approximate times are acceptable
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}

        <label style={label}>
          Observation Narrative
        </label>

        <textarea
          style={{
            ...input,

            height: 180,

            resize: "vertical",
          }}

          value={description}

          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }

          placeholder="Describe the observation, movement, interactions, sound, lighting, or unusual behavior..."
        />

        {/* EMERGENCE GEOMETRY */}

        <div
          style={{
            marginTop: 32,

            padding: 20,

            border: "1px solid #30363d",

            background: "#11161f",
          }}
        >

          <div
            style={{
              marginBottom: 16,

              fontSize: 13,

              letterSpacing: 1,

              color: "#8b949e",
            }}
          >
            EMERGENCE GEOMETRY
          </div>

          {/* ROW 1 */}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
            }}
          >

            <div style={{ flex: 1 }}>

              <label style={label}>
                Object Shape
              </label>

              <select
                style={input}

                value={shape}

                onChange={(e) =>
                  setShape(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Unknown
                </option>

                <option value="sphere_orb">
                  Sphere / Orb
                </option>

                <option value="elongated">
                  Elongated / Cylindrical
                </option>

                <option value="triangular">
                  Triangular
                </option>

                <option value="disc">
                  Disc
                </option>

                <option value="irregular">
                  Irregular
                </option>
              </select>
            </div>

            <div style={{ flex: 1 }}>

              <label style={label}>
                Movement Behavior
              </label>

              <select
                style={input}

                value={movement}

                onChange={(e) =>
                  setMovement(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Unknown
                </option>

                <option value="stationary">
                  Stationary
                </option>

                <option value="linear">
                  Linear
                </option>

                <option value="erratic">
                  Erratic
                </option>

                <option value="hovering">
                  Hovering
                </option>

                <option value="coordinated">
                  Coordinated
                </option>

                <option value="instantaneous_acceleration">
                  Instantaneous Acceleration
                </option>
              </select>
            </div>
          </div>

          {/* ROW 2 */}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
            }}
          >

            <div style={{ flex: 1 }}>

              <label style={label}>
                Sound Characteristics
              </label>

              <select
                style={input}

                value={sound}

                onChange={(e) =>
                  setSound(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Unknown
                </option>

                <option value="silent">
                  Silent
                </option>

                <option value="humming">
                  Humming
                </option>

                <option value="mechanical">
                  Mechanical
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div style={{ flex: 1 }}>

              <label style={label}>
                Lighting / Visibility
              </label>

              <select
                style={input}

                value={lighting}

                onChange={(e) =>
                  setLighting(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Unknown
                </option>

                <option value="self_luminous">
                  Self-Luminous
                </option>

                <option value="reflective">
                  Reflective
                </option>

                <option value="dark_object">
                  Dark Object
                </option>

                <option value="intermittent">
                  Intermittent Flashing
                </option>
              </select>
            </div>
          </div>

          {/* ROW 3 */}

          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >

            <div style={{ flex: 1 }}>

              <label style={label}>
                Observer Context
              </label>

              <select
                style={input}

                value={observerMode}

                onChange={(e) =>
                  setObserverMode(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Unknown
                </option>

                <option value="alone">
                  Alone
                </option>

                <option value="multiple_observers">
                  Multiple Observers
                </option>

                <option value="moving_vehicle">
                  Moving Vehicle
                </option>

                <option value="stationary">
                  Stationary
                </option>

                <option value="group_event">
                  Group Observation
                </option>
              </select>
            </div>

            <div style={{ flex: 1 }}>

              <label style={label}>
                Witness Count
              </label>

              <input
                style={input}

                value={witnessCount}

                onChange={(e) =>
                  setWitnessCount(
                    e.target.value
                  )
                }

                placeholder="Approximate"
              />
            </div>
          </div>
        </div>

        {/* CONDITIONS */}

        <label style={label}>
          Environmental Conditions
        </label>

        <input
          style={input}

          value={conditions}

          onChange={(e) =>
            setConditions(
              e.target.value
            )
          }

          placeholder="Night, cloudy, clear sky, rain, fog, etc."
        />

        {/* DURATION */}

        <label style={label}>
          Approximate Duration (seconds)
        </label>

        <input
          style={input}

          value={duration}

          onChange={(e) =>
            setDuration(
              e.target.value
            )
          }

          placeholder="Optional"
        />

        {/* SUBMIT */}

        <button
          style={{
            marginTop: 28,

            width: "100%",

            padding: "14px",

            background: "#238636",

            color: "white",

            border: "none",

            cursor: "pointer",

            fontWeight: 600,

            fontSize: 15,

            letterSpacing: 0.5,
          }}

          onClick={handleSubmit}

          disabled={
            status === "sending"
          }
        >
          {status === "sending"
            ? "Submitting Observation..."
            : "Submit Structured Observation"}
        </button>

        {/* SUCCESS */}

        {status === "success" && (

          <div style={successBox}>

            ✓ Observation received

            {reportId && (

              <div
                style={{
                  marginTop: 8,
                }}
              >
                Report ID:
                {" "}
                <strong>
                  {reportId}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}

        {status === "error" && (

          <div style={errorBox}>

            Submission failed.

            Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

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

  boxSizing: "border-box" as const,
};

const successBox = {

  marginTop: 20,

  padding: 12,

  background: "#12261a",

  border: "1px solid #2ea043",

  color: "#e6edf3",
};

const errorBox = {

  marginTop: 20,

  padding: 12,

  background: "#2d1111",

  border: "1px solid #f85149",

  color: "#e6edf3",
};