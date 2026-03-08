import './Historique.css'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useEffect, useState, useContext } from "react";
import { supabase } from "../client";
import { AuthContext } from "../Context/AuthContext";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatViews, formatDuration } from '../utils/functionsHelper';


function Historique(){
    const navigate = useNavigate()
    const { user } = useContext(AuthContext);
    const [historyData, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDisabled, setDisabled] = useState(false)

    useEffect(()=>{
        const fetchData = async()=>{
            const { data, error } = await supabase
            .from('watch_history')
            .select(` *, videos (*, profiles(username, avatar_url))`)
            .eq('user_id', user.id)
            error ? toast.error(error.message) : setHistory(data); setLoading(false);
        }
        fetchData()
    }, [])

    const deleteHistorique = async ()=>{
        setDisabled(true)
        const {error} = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id)
        if(error){toast.error(error.message); return}
        else{
            toast.success("delet history data")
            setHistory([])
        }
    }

    return (
        <>
        {loading ? (null):(
            historyData.length === 0 ? (
                <div className="history_empty_container">
                    <p className="history_empty">Your history is empty. Watch a video to get started. </p>
                    <button className='watch_now' onClick={()=>{navigate("/home")}}>Watch now</button>
                </div>
            ):(
            <div className="historique_container">
                <div className="historique_header">
                    <h1>Historique de visionnage</h1>
                    <button className="delete_historique" onClick={deleteHistorique} disabled={isDisabled}>
                        <DeleteOutlineIcon/>
                        Effacer tout l'historique des vidéos regardées
                    </button>
                </div>
                <div className="historique_list">
                    {historyData.map((entry) => (
                        <div className="video_card">
                            <div className="thumbnail_container">
                                <img 
                                    src={entry.videos.thumbnail_url}
                                    alt="thumbnail" 
                                    className="thumbnail"
                                />
                                <p className="duration">{formatDuration(entry.videos.duration_seconds)}</p>
                            </div>
                            <div className="video_info">
                                <div className="video_details">
                                    <h2 className="title">{entry.videos.title}</h2>
                                    <div className='chanel_views'>
                                        <div className='chanel'>
                                            <img src={entry.videos.profiles.avatar_url} alt='user_pic'/>
                                            <p className="channel_name">{entry.videos.profiles.username}</p>
                                        </div>
                                        <div className='views_timing_history'>
                                            <p className="views">{formatViews(entry.videos.views_count)} vues</p>
                                            <p className="history_watched_at">Vu le : {formatDate(entry.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>  
            </div>
        ))}
    </>
    )
}

export default Historique