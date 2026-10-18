export default function Toast({ message, actionLabel, onAction, onClose }) {
  if (!message) return null;
  return (
    <div className="toast toast-top toast-center z-50">
      <div className="alert alert-error">
        <span>{message}</span>
        {actionLabel && (
          <button className="btn btn-sm" onClick={onAction}>{actionLabel}</button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}