import './HomeVideosList.css'
import { useEffect, useState } from "react";
import { formatViews, formatDuration, formatRelativeTime } from '../utils/functionsHelper';
import { supabase } from "../client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function HomeVideosList() {
    const [infos, setInfos]    = useState([]);
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
            .from("videos")
            .select(`video_id, title, thumbnail_url, views_count, duration_seconds, created_at,
                profiles (
                    username,
                    avatar_url
                )
            `)
            .order("created_at", { ascending: false });

            if (error) { toast.error(error.message); } else { setInfos(data); setLoading(false);}
        };

        fetchData();
    }, []);
    

    return (
        <div className="content_wrapper">
            <div className="video_list">
            {loading ? null : (
                infos.length === 0 ? (
                    <div className="no_video_container">
                        <p className="no_videos">Oops...! There are no videos for right now.</p>
                    </div>
                ) : (
                    infos.map((info, index) => (
                    <div key={index} className="video_card">
                        <div className="thumbnail_container" onClick={()=>{navigate(`/watch?v=${info.video_id}`);}}>
                            <img 
                                src={info.thumbnail_url} 
                                alt={info.title} 
                                className="thumbnail"
                            />
                            <p className="duration">{formatDuration(info.duration_seconds)}</p>
                        </div>
                        <div className="video_info">
                            <img 
                                src={info.profiles?.avatar_url || "assets/user.jpg"}
                                alt={`${info.profiles?.username} logo`}
                                className="icon"
                            />
                            <div className="video_details">
                                <h2 className="title">{info.title}</h2>
                                <p className="channel_name">{info.profiles?.username}</p>
                                <div className="views_relative_duration">
                                    <p className="views">{formatViews(info.views_count) } views</p>
                                    <p className="relative_duration">.  {formatRelativeTime(info.created_at) }</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))
                )
            )}
            </div>
        </div>
    );

}

export default HomeVideosList;