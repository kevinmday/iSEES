import { useState } from "react";

type Props = {
  onAnalyze: (data: {
    location: string;
    context: string;
    description: string;
  }) => void;
};

export default function CaptureTab({ onAnalyze }: Props) {
  const [location, setLocation] = useState("");
  const [context, setContext] = useState("unknown");
  const [description, setDescription] = useState("");

  const handleAnalyze = () => {
    onAnalyze({ location, context, description });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>New Case</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Location (e.g. Medford, OR)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <select
          value={context}
          onChange={(e) => setContext(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="unknown">Unknown</option>
          <option value="aviation">Aviation</option>
          <option value="military">Military</option>
          <option value="witness">Witness</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <textarea
          placeholder="Describe what happened..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
        />
      </div>

      <button onClick={handleAnalyze}>
        Analyze
      </button>
    </div>
  );
}