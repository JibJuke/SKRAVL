import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";

/**
 * Navbar Component
 *
 * Main navigation bar that appears at the top of the application.
 * Provides navigation links to Home and Profile pages.
 * Features responsive design with a hamburger menu for mobile devices.
 */

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-logo">
          <img
            src="/Navbar-logo.svg"
            alt="Skravl Logo"
            className="navbar-logo-img"
          />
        </Link>

        <div className="navbar-menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <li>
            <Link to="/home" onClick={() => setIsOpen(false)}>
              <FaHome className="menu-icon" /> Home
            </Link>
          </li>
          <li>
            <Link to="/profile" onClick={() => setIsOpen(false)}>
              <FaUser className="menu-icon" /> Profile
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
