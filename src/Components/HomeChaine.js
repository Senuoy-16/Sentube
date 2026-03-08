import { NavLink, Outlet } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import './HomeChaine.css' 
import { useEffect, useState, useContext } from "react";
import { supabase } from "../client";

function HomeChaine() {
    const { user } = useContext(AuthContext);

    const [subscribersCount, setSubscribersCount] = useState(0);
    const [videosCount, setVideosCount] = useState(0);

    const navLinkStyles = ({ isActive }) => ({
        fontWeight: isActive ? 'bold' : 'normal',
        borderBottom: isActive ? "2px solid var(--black-color)" : "2px solid transparent",
    });

    useEffect(()=>{
        const fetchData = async ()=>{

            const { count: subscribersCount, error:subscribersCountErrors } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('subscribed_to_user_id', user.id)
            setSubscribersCount(subscribersCount)
            
            const { count: videosCount, error:VideoCountErrors } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            setVideosCount(videosCount)

        }
        fetchData()
    }, [])


  return (
    <div className="home_container">
        <div className="home_header">
            <div className="picture_user">
                <img alt="picture_user" src={user.user_metadata.avatar_url} />
            </div>
            <div className="infos_user">
                <h1>{user.user_metadata.nom} {user.user_metadata.prenom}</h1>
                <div className="more_infos_user">
                    <p className="username">@{user.user_metadata.username} .</p>
                    <p className="abonnes_counter"><span>{subscribersCount}</span> abonnes .</p>
                    <p className="videos_counter"> <span>{videosCount}</span> videos .</p>
                </div>
                <button className="btn_modify_chaine">Editer votre chaine</button>
            </div>
        </div>
        {/* NAVIGATION */}
        <div className="home_sections">
            <NavLink end style={navLinkStyles} className="link_section" to=".">Info</NavLink>
            <NavLink style={navLinkStyles} className="link_section" to="historique">Historique</NavLink>
            <NavLink style={navLinkStyles} className="link_section" to="videos">Videos</NavLink>
            <NavLink style={navLinkStyles} className="link_section" to="watch_later">Watch Later</NavLink>
        </div>

        {/* NESTED ROUTES */}
        <Outlet context={{ setVideosCount }}  />
    </div>
  );
}

export default HomeChaine;
