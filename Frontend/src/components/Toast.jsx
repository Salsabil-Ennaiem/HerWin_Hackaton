export default function Toast({ message, onClose, actionLabel, onAction }) {
  if (!message) return null;

  return (
    <div className="toast toast-bottom toast-center">
      <div className="alert alert-warning">
        <span>{message}</span>
        {actionLabel && (
          <button className="btn btn-sm btn-outline" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {onClose && (
          <button className="btn btn-xs btn-ghost" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}