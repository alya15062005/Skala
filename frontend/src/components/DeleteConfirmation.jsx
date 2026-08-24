import { FiAlertTriangle } from "react-icons/fi";
import "./DeleteConfirmation.css";

const DeleteConfirmation = ({
  show,
  onClose,
  onConfirm,
  title = "Apakah Anda Yakin?",
  message = "Tindakan ini tidak dapat dibatalkan. Data yang dihapus akan hilang permanen.",
  confirmText = "Hapus",
  cancelText = "Batal",
  isDeleting = false
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error during delete:", error);
    }
  };

  if (!show) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon-bg">
          <FiAlertTriangle />
        </div>

        <h2 className="delete-modal-title">{title}</h2>
        <p className="delete-modal-text">{message}</p>

        <div className="delete-modal-actions">
          <button
            className="btn-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : confirmText}
          </button>
          <button
            className="btn-delete-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;