import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import './SideBar.css'

function SideBar({ toggleSidebar}){
  const {user} = useContext(AuthContext)
  
  const navigate = useNavigate()
  return (
    <>
    <div className="overlay" onClick={toggleSidebar}></div>
    <aside className="sidebar">
      <div className="link_container">
        <div className="nav_section nav_left">
        <button className="nav_button menu_button" onClick={toggleSidebar}>
        <i className="uil uil-bars"></i>
        </button>
        <a className="nav_logo">
        <img className="logo_image" src="../../assets/logo.png" alt="logo" />
        <h2 className="logo_text">SenTube</h2>
        </a>
        </div>
        
        <div className="link_section">
        <a className="link_item" onClick={()=>{navigate("/home")}}>
        <i className="uil uil-estate"></i>Home
        </a>
        <a className="link_item">
        <i className="uil uil-video"></i>Shorts
        </a>
        <a className="link_item">
        <i className="uil uil-tv-retro"></i>Subscriptions
        </a>
        </div>
        
        <div className="section_separator"></div>

        <div className="link_section">
        <h4 className="section_title">Your</h4>
        <a className="link_item" onClick={()=>{navigate(`/channel/${user.user_metadata.username}`)}}>
        <i className="uil uil-user-square"></i>Your Channel
        </a>
        <a className="link_item">
        <i className="uil uil-history"></i>History
        </a>
        <a className="link_item">
        <i className="uil uil-clock"></i>Watch Later {/* Capitalized */}
        </a>
        </div>
        
        <div className="section_separator"></div>

        <div className="link_section">
        <h4 className="section_title">Explore</h4>
        <a className="link_item">
        <i className="uil uil-fire"></i>Trending
        </a>
        <a className="link_item">
        <i className="uil uil-basketball"></i>Sports {/* Fixed: Sport -> Sports */}
        </a>
        <a className="link_item">
        <i className="uil uil-music"></i>Music
        </a>
        <a className="link_item">
        <i className="uil uil-trophy"></i>Gaming
        </a>
        </div>
        
        <div className="section_separator"></div>

        <div className="link_section">
        <h4 className="section_title">More about SenTube</h4>
        <a className="link_item">
        <i className="uil uil-shield-plus"></i>SenTube Plus
        </a>
        <a className="link_item">
        <i className="uil uil-headphones-alt"></i>SenTube Music
        </a>
        <a className="link_item">
        <i className="uil uil-airplay"></i>SenTube Kids
        </a>
        </div>
        
        <div className="section_separator"></div>

        <div className="link_section">
        <a className="link_item">
        <i className="uil uil-setting"></i>Settings
        </a>
        <a className="link_item">
        <i className="uil uil-info"></i>Report
        </a>
        <a className="link_item">
        <i className="uil uil-question-circle"></i>Help
        </a>
        <a className="link_item">
        <i className="uil uil-exclamation-triangle"></i>Feedback {/* Fixed spelling */}
        </a>
        </div>
        
        <div className="section_separator"></div>
      </div>
    </aside>
    </>
  );
}

export default SideBar;