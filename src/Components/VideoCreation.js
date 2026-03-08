import React, {useState, useEffect, useContext} from 'react';
import './VideoCreation.css'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ModalCreationVideo from './ModalCreationVideo'
import { supabase } from '../client';
import { AuthContext } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { formatViews, formatDuration, formatDate } from '../utils/functionsHelper';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from "react-router-dom";


function VideoCreation(){
    const { setVideosCount } = useOutletContext();

    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
    const {user} = useContext(AuthContext);
    const navigate = useNavigate()

    useEffect(()=>{
        const fetchData = async () => {
            const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            if(error){toast.error(error.message); return}
            else{setData(data); setLoading(false)}
        }
        fetchData()  
    }, [])

    const deleteVideoCreation = async (videId) => {
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('video_id', videId);

        if (error) { toast.error(error.message);} 
        else {
            toast.success("Video deleted");
            setData(prev => prev.filter(video => video.video_id !== videId));
        }
    };

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel("videos-realtime")
            .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "videos",
                filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
                if (payload.eventType === "INSERT") { setData((prev) => [payload.new, ...prev]); setVideosCount(prev => prev + 1);}
                if (payload.eventType === "DELETE") { setData((prev) => prev.filter((video) => video.video_id !== payload.old.video_id) ); setVideosCount(prev => prev - 1); }
            }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        }, [user?.id]);



    return (
        <>
            <div className='video_creation_container'>
                <div className='video_creation_header'>
                    <h1>Le contenu de la chaine</h1>
                    <button 
                        className='add_video_btn'
                        onClick={()=>{setOpen(true)}}
                    >
                        <AddIcon/> Add
                    </button>
                </div>
                <div className='video_creation_body'>
                    <table>
                        <thead>
                            <tr>
                                <th>Video</th>
                                <th>Date</th>
                                <th>Vues</th>
                                <th>Commentaire</th>
                                <th>Likes</th>
                                <th>Dislikes</th>
                                <th>Supprimer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? null : (
                                data && data.length > 0 ? (
                                    data.map((video, index) => (
                                        <tr key={video.video_id}>
                                            <td className='video'>
                                                <div className='Video_info'>
                                                    <div className='thumbnail' onClick={()=>{navigate(`/watch?v=${video.video_id}`)}}>
                                                        <div className='image'>
                                                            <img alt="video_pic" src={video.thumbnail_url} />
                                                        </div>
                                                        <div className='duration'>{formatDuration(video.duration_seconds)}</div>
                                                    </div>
                                                    <div className='description'>
                                                        <p className='title' onClick={()=>{navigate(`/watch?v=${video.video_id}`)}}>
                                                            {video.title}
                                                        </p>
                                                        <div className='modification_video'>
                                                            <EditIcon />
                                                            <p>Modifier votre video</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='date'>
                                                <p>{formatDate(video.created_at, 'fr-FR')}</p>
                                            </td>
                                            <td className='vues'>
                                                <p>{formatViews(video.views_count)}</p>
                                            </td>
                                            <td className='Commentaires'>
                                                <p>{formatViews(video.comments_count)}</p>
                                            </td>
                                            <td className='likes'>
                                                <p>{formatViews(video.likes_count)}</p>
                                            </td>
                                            <td className='dislikes'>
                                                <p>{formatViews(video.dislikes_count)}</p>
                                            </td>
                                            <td className='supprimer' onClick={()=>{deleteVideoCreation(video.video_id)}}>
                                                <DeleteOutlineIcon />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className='list_empty_video_creation' colSpan={7}>
                                            <p>
                                                You haven't uploaded any videos yet. Click the Add button in the top right to create your first one.
                                            </p>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            <ModalCreationVideo open={open} setOpen={setOpen}/>
        </>
  );
}

export default VideoCreation;