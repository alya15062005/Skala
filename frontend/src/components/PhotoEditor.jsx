import { useRef, useState } from "react";
import { FiCheck, FiRotateCcw, FiX } from "react-icons/fi";
import "./PhotoEditor.css";

export default function PhotoEditor({ imageSrc, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirm = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob((blob) => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        onConfirm(file);
      }, "image/jpeg", 0.9);
    };

    img.src = imageSrc;
  };

  return (
    <div className="photo-editor-overlay">
      <div className="photo-editor-modal">
        <div className="photo-editor-header">
          <h2>Edit Foto</h2>
          <button
            className="photo-editor-close"
            onClick={onCancel}
            type="button"
          >
            <FiX />
          </button>
        </div>

        <div className="photo-editor-content">
          <div
            className="photo-preview-container"
            ref={containerRef}
            onWheel={(e) => {
              e.preventDefault();
              handleWheel(e);
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Preview"
              className="photo-preview"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            />
          </div>

          <div className="photo-editor-hints">
            <p>💡 Scroll untuk zoom • Drag untuk geser • Klik tombol untuk rotasi</p>
          </div>

          <div className="photo-editor-controls">
            <div className="control-group">
              <button
                className="editor-btn rotate-btn"
                onClick={handleRotate}
                type="button"
              >
                <FiRotateCcw /> Rotasi {rotation}°
              </button>
            </div>

            <div className="zoom-info">
              Zoom: {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>

        <div className="photo-editor-footer">
          <button
            className="editor-btn cancel-btn"
            onClick={onCancel}
            type="button"
          >
            <FiX /> Batal
          </button>
          <button
            className="editor-btn confirm-btn"
            onClick={handleConfirm}
            type="button"
          >
            <FiCheck /> Simpan & Upload
          </button>
        </div>
      </div>
    </div>
  );
}
