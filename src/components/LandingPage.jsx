import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

/**
 * Initial landing page that serves as the entry point to the application.
 * Displays the logo and a Get Started button for users to begin.
 */

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <img src="/Skravl-logo.svg" alt="Skravl Logo" className="logo" />
        <Link to="/auth" className="get-started-btn">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
