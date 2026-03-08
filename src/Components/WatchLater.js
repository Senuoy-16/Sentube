import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css/pagination";
import "swiper/css";

import "./WatchLater.css";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../client";
import { formatRelativeTime, formatViews } from "../utils/functionsHelper";

import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function WatchLater() {
    const swiperWrapperRed = useRef(null)
    const [watchLater, setWatchLater] = useState([])
    const navigate = useNavigate()

    useEffect(()=>{
        const fetchData = async()=>{
            let { data: watch_later, error } = await supabase
            .from('watch_later')
            .select(`
                videos (
                    video_id,
                    thumbnail_url,
                    title,
                    description,
                    likes_count,
                    dislikes_count,
                    views_count,
                    created_at
                )
            `)
            if(error){toast.error(error.message)}
            else{setWatchLater(watch_later)}
        }
        fetchData()
    }, [])

    function adjustMargin(){
        const screenwidth = window.innerWidth;
        console.log(screenwidth)
        if(swiperWrapperRed.current){
            swiperWrapperRed.current.style.marginLeft = 
            screenwidth <= 520
            ? "0px"
            : screenwidth <= 650
            ?"-50px"
            :screenwidth <= 800
            ? "-100px"
            : "-150px"
        }
    }

    useEffect(()=>{
        adjustMargin()
        window.addEventListener('resize', adjustMargin)
        return ()=> window.removeEventListener("resize", adjustMargin)
    }, [])
    
    
  return (
    <main className="main_watch_later">
      <div className="container_watch_later">
        <Swiper
          modules={[Pagination]}
          grabCursor
          initialSlide={0}
          centeredSlides
          slidesPerView="auto"
          speed={800}
          slideToClickedSlide
          pagination={{clickable:true}}
          breakpoints={{
            320: {spaceBetween:40},
            650: {spaceBetween:30},
            1000: {spaceBetween:20}
          }}
          onSwiper={(swiper)=>{
            swiperWrapperRed.current = swiper.wrapperEl
          }}
        >
          {watchLater.map((video, index) => (
            <SwiperSlide key={index}>
              <img src={video.videos.thumbnail_url} alt={video.videos.title} />

              <div className="title">
                <h1>{video.videos.title}</h1>
              </div>

              <div className="content">
                <div className="text-box">
                    <p>{video.videos.description}</p>
                </div>
              </div>

              <div className="footer">
                <div className="category">
                    <span style={{ "--i": 1 }}>
                      {formatViews(video.videos.views_count)} <VisibilityIcon/>
                    </span>
                    <span style={{ "--i": 2 }}>
                      {formatViews(video.videos.likes_count)} <ThumbUpOffAltIcon/>
                    </span>
                    <span style={{ "--i": 2 }}>
                      {formatViews(video.videos.dislikes_count)} <ThumbDownOffAltIcon/>
                    </span>
                </div>
                <div className="date_btn_view">
                    <p>{formatRelativeTime(video.videos.created_at)}</p>
                    <button className="label" onClick={()=>{navigate(`/watch?v=${video.videos.video_id}`)}}>
                        <p>watch now</p>
                    </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </main>
  );
}

export default WatchLater;
