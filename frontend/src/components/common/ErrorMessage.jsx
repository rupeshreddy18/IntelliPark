import { FiAlertCircle } from "react-icons/fi";

/**
 * ErrorMessage — Displays an error alert.
 */
const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="alert alert-error">
      <FiAlertCircle />
      <span>{message}</span>
      {onRetry && (
        <button
          className="btn btn-sm btn-secondary"
          onClick={onRetry}
          style={{ marginLeft: "auto" }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
