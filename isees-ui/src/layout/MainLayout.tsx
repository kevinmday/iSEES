export default function MainLayout({ left, center, right }: any) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0f1a", color: "white" }}>
      
      <div style={{ width: 220, borderRight: "1px solid #222", padding: 10 }}>
        {left}
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        {center}
      </div>

      <div style={{ width: 300, borderLeft: "1px solid #222", padding: 10 }}>
        {right}
      </div>

    </div>
  );
}