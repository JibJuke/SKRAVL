// Loading.jsx
import { useState, useEffect } from "react";
import "../styles/Loading.css";

const Loading = ({ message = "Loading..." }) => {
  const [visible, setVisible] = useState(false);

  // when mounted, trigger the fade-in
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`loading-overlay${visible ? " visible" : ""}`}>
      <div className="loading-dots">
        <span />
        <span />
        <span />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;
