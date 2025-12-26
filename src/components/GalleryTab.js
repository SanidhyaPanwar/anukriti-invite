import React from "react";

function GalleryTab({ photos }) {
  if (!photos || photos.length === 0) {
    return <p>We could not find photos for you yet, but we are excited to see you at the wedding!</p>;
  }

  return (
    <div>
      <h2>Memories with You</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginTop: "1rem",
        }}
      >
        {photos.map((url, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <img
              src={url}
              alt={`Memory ${idx + 1}`}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default GalleryTab;
