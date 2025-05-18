import "../styles/Loading.css";
/**
 * Loading indicator component with customizable message.
 * Used throughout the app to indicate loading states.
 */
const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;
