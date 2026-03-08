import LinkIcon from '@mui/icons-material/Link';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import VideocamIcon from '@mui/icons-material/Videocam';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import './info.css'

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../Context/AuthContext";
import { supabase } from '../client';
import toast from 'react-hot-toast';

import { formatDate } from '../utils/functionsHelper';

function Info(){
    const { user } = useContext(AuthContext);
    const [viewsCount, setViewsCount] = useState(null)
    useEffect(()=>{
        const fetchData = async ()=>{
            const { data: totalViews, error } = await supabase.rpc('get_total_views', {user_uuid: user.id,});
            error ? toast.error(error): setViewsCount(totalViews)
        }
        fetchData()
    },[])
        
    return (
        <div className="info_container">
            <div className="info">
                <LinkIcon/>
                <p>www.sentube.com/@{user.user_metadata.username}</p>
            </div>

            <div className="info">
                <InfoOutlineIcon/>
                <p>Actif depuis {formatDate(user.created_at)}</p>
            </div>

            <div className="info">
                <RemoveRedEyeIcon/>
                <p>{viewsCount} vues</p>
            </div>
            
        </div>
    )
}

export default Info;