/**
 * Loading — Displays a spinner while data is being fetched.
 */
const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;
