import './NavBar.css'
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from '../Context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';


function NavBar({ toggleSidebar}) {
  const navigate = useNavigate()
  
  const { user, logout } = useContext(AuthContext);
  
  const [isDark, setIsDark] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    // Parse the saved value, default to false if not found
    return savedMode ? JSON.parse(savedMode) : false;
  });
  
  const toggleDarkMode = () => {
    setIsDark(prevMode => {
      const newMode = !prevMode;
      // Save to localStorage whenever mode changes
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return newMode;
    });
  };
  
  useEffect(() => {
    isDark ? document.body.classList.add("dark_mode") : document.body.classList.remove("dark_mode");
    localStorage.setItem("darkMode", JSON.stringify(isDark));
    return () => {document.body.classList.remove("dark_mode");};
  }, [isDark]);

  return ( 
    <>
      <header>
        <nav className="navbar">
          <div className="nav_section nav_left">
            <button onClick={toggleSidebar} className="nav_button menu_button">
              <i className="uil uil-bars"></i>
            </button>
            <div className="nav_logo" onClick={()=>{navigate("/home")}}>
              <img className="logo_image" src="../../assets/logo.png" alt="logo" />
              <h2 className="logo_text">SenTube</h2>
            </div>
          </div> 

          <div className="nav_section nav_center">
            <form action="" className="search_form">
              <input className="search_input" type="search" placeholder="Search..." required />
              <button className="nav_button search_button" onClick={(e)=>{e.preventDefault()}}>
                <i className="uil uil-search"></i>
              </button>
            </form>
            <button className="nav_button mic_button">
              <i className="uil uil-microphone"></i>
            </button>
          </div>

          <div className="nav_section nav_right">
            <button onClick={toggleDarkMode} className="nav_button theme_button">
              <i className={isDark ? "uil uil-sun":"uil uil-moon"}></i>
            </button>
            <button className="logout_btn" onClick={logout}>
                <LogoutIcon className='logout_btn_icon'/>
            </button>
            <Link to={`/channel/${user.user_metadata.username}`}>
              <img src={user?.user_metadata?.avatar_url || "public/assets/logo.png"} alt="user profile" className="user_image" />
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}

export default NavBar;