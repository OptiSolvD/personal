import React from 'react';

export default function Gallery({ items = [] }) {
  return (
    <div>
      {items.map((m) => (
        <div key={m._id} style={{ marginBottom: 12 }}>
          <h4>{m.title}</h4>
          {m.imageUrl && <img src={m.imageUrl} alt={m.title} style={{ maxWidth: 300 }} />}
          <p>{m.description}</p>
        </div>
      ))}
    </div>
  );
}
