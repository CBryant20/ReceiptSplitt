import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { logout, selectToken } from "../features/auth/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

import "./Navbar.less";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector(selectToken);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className='top'>
      <h1>Receipt Split</h1>
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      >
        <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
      </button>
      <menu className={`menu ${menuOpen ? "open" : ""}`}>
        <li>
          <NavLink to='/' onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
        </li>
        {token ? (
          <li>
            <a
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
            >
              Log Out
            </a>
          </li>
        ) : (
          <li>
            <NavLink to='/login' onClick={() => setMenuOpen(false)}>
              Log In
            </NavLink>
          </li>
        )}
      </menu>
    </nav>
  );
}
