import React, {useState, useEffect, useContext} from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthContext } from "./Context/AuthContext";
import NavBar from "./Components/NavBar";
import SideBar from "./Components/SIdeBar";
import Signup from "./Components/Signup";
import Signin from "./Components/Signin";
import HomeVideosList from "./Components/HomeVideosList";
import WatchPage from "./Components/WatchPage";

import HomeChaine from "./Components/HomeChaine";
import Info from "./Components/Info";
import Historique from "./Components/Historique";
import VideoCreation from "./Components/VideoCreation";
import WatchLater from "./Components/WatchLater";

import NotFound404 from "./Components/NotFound404";
import './style.css'

function App() {
  const { session, loading} = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  // Add/remove class to body when sidebar state changes
  useEffect(() => {
    isSidebarOpen ? document.body.classList.remove("sidebar_hidden") : document.body.classList.add("sidebar_hidden");
    return () => {document.body.classList.add("sidebar_hidden");};
  }, [isSidebarOpen]);
  
  if (loading) {return null}

  return (
    <div className="container">
      {session ? <NavBar  toggleSidebar={toggleSidebar}/> : null}
      {session ? <SideBar  toggleSidebar={toggleSidebar}/> : null}
      <main className="main_layout">
          <Routes>
              <Route
                path="/"
                element={session ? <Navigate to="/home" /> : <Signin />}
              />
              <Route
                path="/signup"
                element={session ? <Navigate to="/home" /> : <Signup />}
              />
              <Route
                path="/home"
                element={session ? <HomeVideosList /> : <Navigate to="/" /> }
              />
              
              {session && (
                <Route path="/channel/:username" element={<HomeChaine />}>
                  <Route index element={<Info />} />
                  <Route path="historique" element={<Historique />} />
                  <Route path="videos" element={<VideoCreation />} />
                  <Route path="watch_later" element={<WatchLater />} />
                </Route>
              )}
              {session ? <Route path="/watch" element={<WatchPage/>} /> : null}

              <Route path="*" element={<NotFound404/>} />
          </Routes>
      </main>
    </div>
  );
}

export default App;
