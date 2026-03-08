import './WatchPage.css'
import VideoWatchPage from "./VideoWatchPage"
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../Context/AuthContext";
import { supabase } from '../client';
import toast from 'react-hot-toast';
import { formatViews, formatDuration, formatDate, formatRelativeTime } from '../utils/functionsHelper';

function WatchPage(){
    const { user } = useContext(AuthContext)

    const [videoinfo, setVideoInfo] = useState({});
    const [userReaction, setUserReaction] = useState(null);

    const [sugesstedVideos, setsugesstedVideos] = useState(null)

    const [commentsinfo, setCommentsInfo] = useState(null);
    const [addComment, setAddComment] = useState("")

    const [loading, setLoading] = useState(true)

    const [subscribersCount, setSubscribersCount] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subLoading, setSubLoading] = useState(false);

    const [isWatchLater, setWatchLater] = useState(false)

    const [searchParams] = useSearchParams();
    const videoId = searchParams.get('v');

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from("videos")
                .select(`video_id, title, description, video_url, thumbnail_url, views_count, likes_count, dislikes_count, comments_count, created_at, duration_seconds,
                    profiles (
                        user_id,
                        username,
                        avatar_url
                    )
                `)
                .eq('video_id', videoId)
                .single()

            if (error) { toast.error(error.message) }  else { setVideoInfo(data) }

            if (data?.profiles?.user_id) {
                const { count, error: subError } = await supabase
                    .from('subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('subscribed_to_user_id', data.profiles.user_id);

                if (!subError) setSubscribersCount(count || 0);
            }
            if (user && data?.profiles?.user_id) {
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("subscription_id")
                    .eq("subscriber_id", user.id)
                    .eq("subscribed_to_user_id", data.profiles.user_id)
                    .maybeSingle();
                setIsSubscribed(!!sub);
            }

            if (user && data?.video_id) {
                const { data: watchLater, error:watch_later_error } = await supabase
                    .from("watch_later")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("video_id", data.video_id)
                    .maybeSingle();
                if(watch_later_error){toast.error(watch_later_error.message)}
                setWatchLater(!!watchLater);
            }

            const { data:reactionData, error:reactionErreur } = await supabase
                .from("video_reactions")
                .select("reaction_type")
                .eq("video_id", videoId)
                .eq("user_id", user.id)
                .maybeSingle();
            if(reactionErreur){toast.error(reactionErreur.message)}
            else{setUserReaction(reactionData?.reaction_type || null);}


            const { data: comments, error: commentsError } = await supabase
                .from("comments")
                .select(`comment_id, video_id, content, created_at,
                    profiles (
                        username,
                        avatar_url
                    )
                `)
                .eq('video_id', videoId)
                .order('created_at', { ascending: false })
            if (commentsError) { toast.error(commentsError.message) } else { setCommentsInfo(comments) }

            const { data: s_videos, error: s_video_error } = await supabase
                .from("videos")
                .select(`video_id, title, thumbnail_url, views_count, created_at, duration_seconds,
                    profiles (
                        username
                    )
                `)
                .neq('video_id', videoId)
                .limit(20)
            if (s_video_error) { toast.error(s_video_error.message) } else { setsugesstedVideos(s_videos) }

            setLoading(false)
        }

        fetchData()
    }, [videoId, user, videoinfo])


    // real time reaction video
    useEffect(() => {
        if (!videoId) return;

        const channel = supabase
            .channel(`videos:${videoId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "videos",
                    filter: `video_id=eq.${videoId}`
                },
                payload => {
                    setVideoInfo(prev => ({
                        ...prev,
                        likes_count: payload.new.likes_count,
                        dislikes_count: payload.new.dislikes_count,
                        comments_count: payload.new.comments_count
                    }));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel);};
    }, [videoId]);
    
    const toggleReaction = async (type) => {
        if (!user) { toast.error("Login required"); return; }

        //  DB SYNC
        const { data: existing } = await supabase
            .from("video_reactions")
            .select("reaction_id, reaction_type")
            .eq("video_id", videoId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (!existing) {
            await supabase.from("video_reactions").insert({
                video_id: videoId,
                user_id: user.id,
                reaction_type: type
            });

            await supabase.rpc("increment_video_reaction", {
                vid: videoId,
                reaction: type
            });
            setUserReaction(type);
            return;
        }

        if (existing.reaction_type === type) {
            await supabase
                .from("video_reactions")
                .delete()
                .eq("reaction_id", existing.reaction_id);

            await supabase.rpc("decrement_video_reaction", {
                vid: videoId,
                reaction: type
            });
            setUserReaction(null);
            return;
        }

        await supabase
            .from("video_reactions")
            .update({ reaction_type: type })
            .eq("reaction_id", existing.reaction_id);

        await supabase.rpc("switch_video_reaction", {
            vid: videoId,
            new_reaction: type
        });
        setUserReaction(type);
    };

    //real time adding comment
    useEffect(() => {
        if (!videoId || !user) return;

        const channel = supabase
            .channel(`comments:${videoId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "comments",
                    filter: `video_id=eq.${videoId}`,
                },
                (payload) => {
                    const newComment = payload.new;
                    const profile = newComment.user_id === user.id
                        ? {
                            username: user.user_metadata.username,
                            avatar_url: user.user_metadata.avatar_url,
                        }
                        : null;

                    setCommentsInfo((prev) => prev ? [{ ...newComment, profiles: profile }, ...prev] : [{ ...newComment, profiles: profile }]);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [videoId, user, videoinfo]);
    const requestAddComment = async (e) => {
        e.preventDefault();
        if (!addComment.trim()) return;

        const { error } = await supabase.from("comments").insert({
            video_id: videoId,
            user_id: user.id,
            content: addComment,
        });
        if (error) {toast.error(error.message);} 
        else {
            setAddComment("");
            toast.success("comment added successfully!");
        }
    };


    //real time subscriptions
    useEffect(() => {
        const channelOwnerId = videoinfo?.profiles?.user_id;
        if (!channelOwnerId) return;

        const channel = supabase
            .channel(`subscriptions:${channelOwnerId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "subscriptions",
                    filter: `subscribed_to_user_id=eq.${channelOwnerId}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setSubscribersCount((prev) => prev + 1);
                    }

                    if (payload.eventType === "DELETE") {
                        setSubscribersCount((prev) => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [videoinfo?.profiles?.user_id]);
    const toggleSubscription = async (channelUserId) => {
        if (!user?.id || !channelUserId) return;

        if (user.id === channelUserId) {
            toast.error("You can't subscribe to yourself 😅");
            return;
        }

        if (subLoading) return;
        setSubLoading(true);

        // UNSUBSCRIBE
        if (isSubscribed) {
            const { error } = await supabase
                .from("subscriptions")
                .delete()
                .eq("subscriber_id", user.id)
                .eq("subscribed_to_user_id", channelUserId);

            if (!error) setIsSubscribed(false);
            else toast.error(error.message);

            setSubLoading(false);
            return;
        }

        // SUBSCRIBE
        const { error } = await supabase
            .from("subscriptions")
            .insert({
                subscriber_id: user.id,
                subscribed_to_user_id: channelUserId,
            });

        if (!error) setIsSubscribed(true);
        else if (error.code !== "23505") toast.error(error.message);

        setSubLoading(false);
    };

    //add to watch later
    const toggleWatchlater = async (videowatchId) => {
        if (!user?.id || !videowatchId) return;

        // REMOVE
        if (isWatchLater) {
            const { error } = await supabase
                .from("watch_later")
                .delete()
                .eq("video_id", videowatchId)
                .eq("user_id", user.id);

            if (error) toast.error(error.message);
            else {
                toast.success("Removed from Watch Later");
                setWatchLater(false);
            }
            return;
        }

        // ADD
        const { error } = await supabase
            .from("watch_later")
            .insert({
                video_id: videowatchId,
                user_id: user.id,
            });

        if (error) toast.error(error.message);
        else {
            toast.success("Added to Watch Later");
            setWatchLater(true);
        }
    };



    if (loading) { return null}
    return (
        <div className="content_wrapper">
            <div className="content_grid">

                <div className="video">
                    {videoinfo && (
                        <VideoWatchPage
                            video_url={videoinfo.video_url}
                            thumbnail_url={videoinfo.thumbnail_url}
                            video_id={videoinfo.video_id}
                        />
                    )}
                </div>

                <div className="about">
                    <h1>{videoinfo.title}</h1>

                    <div className="info_about">
                        <div className="chaine">
                            <img
                                src={videoinfo.profiles?.avatar_url}
                                alt={`user_${videoinfo.profiles?.username}/avatar`}
                            />
                            <div className="info_chaine">
                                <p className="name">
                                    
                                    {videoinfo.profiles?.user_id === user.id ? "Vous" :videoinfo.profiles?.username}
                                </p>
                                <p className="followers">{formatViews(subscribersCount)} abonnees</p>
                            </div>
                            {videoinfo.profiles?.user_id === user.id ?(null):(
                                <button
                                    className={`subscribe-btn ${isSubscribed ? "subscribed" : ""}`}
                                    disabled={subLoading}
                                    onClick={() => toggleSubscription(videoinfo.profiles?.user_id)}
                                >
                                    {isSubscribed ? "Abonné" : "S'abonner"}
                                </button>
                            )}
                        </div>

                        <div className="btns">
                            <div className="liking">
                                <button
                                 className={`like ${userReaction === "like" ? "active" : ""}`}
                                 onClick={() => toggleReaction("like")}
                                >
                                    <i className="fa-regular fa-thumbs-up"></i>
                                    <span>{formatViews(videoinfo.likes_count)}</span>
                                </button>
                                <button 
                                 className={`dislike ${userReaction === "dislike" ? "active" : ""}`}
                                 onClick={() => toggleReaction("dislike")}
                                >
                                    <i className="fa-regular fa-thumbs-down"></i>
                                    <span>{formatViews(videoinfo.dislikes_count)}</span>
                                </button>
                            </div>
                            <button className="share">
                                <i className="fa-solid fa-share"></i>
                                <span>Partage</span>
                            </button>
                            <button className={isWatchLater? "watch_later active" : "watch_later"} onClick={()=>{toggleWatchlater(videoinfo.video_id)}}>
                                <i class="fa-regular fa-alarm-clock"></i>
                                <span>
                                    {isWatchLater? "remove from watch later" : " add to watch later"}
                                </span>
                            </button>
                            <button className="clip">
                                <i className="fa-solid fa-scissors"></i>
                                <span>Clip</span>
                            </button>
                        </div>
                    </div>
                    <div className='about_description'>
                        <div className='date_and_views'>
                            <p>{formatViews(videoinfo.views_count)} views</p>
                            <p>{formatRelativeTime(videoinfo.created_at) }</p>
                        </div>
                        <div className='description'>
                            {videoinfo.description}
                        </div>
                    </div>
                </div>

                <div className="comments">
                    <div className="header_comments">
                        <h1>{formatViews(videoinfo.comments_count)} comments</h1>
                        <div className="trier">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M21 5H3a1 1 0 000 2h18a1 1 0 100-2Zm-6 6H3a1 1 0 000 2h12a1 1 0 000-2Zm-6 6H3a1 1 0 000 2h6a1 1 0 000-2Z"></path>
                            </svg>
                            Trier
                        </div>
                    </div>

                    <div className="comments_list">

                        <div className="comment_container add_comment">
                            <div className="principal">
                                <div className="image">
                                    <img src={user.user_metadata.avatar_url} alt=""/>
                                </div>
                                <div className="comment">
                                    <form> 
                                        <input type="text" placeholder="Ajoutez un commentaire…" value={addComment} onChange={(e)=>{setAddComment(e.target.value)}}/>
                                        <div className="btn_form">
                                            <button className="reset"  type="reset"  disabled={addComment.trim() === ""} onClick={()=>{setAddComment("")}}>Annuler</button>
                                            <button className="submit" type="submit" disabled={addComment.trim() === ""} onClick={requestAddComment}>Ajouter un commentaire</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {commentsinfo && commentsinfo.length > 0 ? (
                            commentsinfo.map(comment => (
                                <div className="comment_container" key={comment.comment_id}>
                                    <div className="principal">
                                        <div className="image">
                                            <img src={comment.profiles?.avatar_url || "assets/user.jpg"} alt=""/>
                                        </div>
                                        <div className="comment">
                                            <div className="header_comment">
                                                <a href="#" className="channel">@{comment.profiles?.username}</a>
                                                <span>{formatRelativeTime(comment.created_at)}</span>
                                            </div>
                                            <div className="body_comment">
                                                <p>{comment.content}</p>
                                            </div>
                                            {/**
                                            <div className="footer_comment">
                                                <button className="like_comment">
                                                    <i className="fa-regular fa-thumbs-up"></i>
                                                    <span>0</span>
                                                </button>
                                                <button className="dislike_comment">
                                                    <i className="fa-regular fa-thumbs-down"></i>
                                                    <span>0</span>
                                                </button>
                                            </div>
                                            */}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='no_comments'>
                                Soyez le premier à laisser un commentaire !
                            </p>
                        )}

                    </div>
                </div>

                <div className="suggestion">
                    <div className="list">

                        {sugesstedVideos && sugesstedVideos.map(video => (
                            <a
                                href={`/watch?v=${video.video_id}`}
                                className="sugesstion_video"
                                key={video.video_id}
                            >
                                <div className="image">
                                    <img src={video.thumbnail_url} alt=""/>
                                    <div className="time">{formatDuration(video.duration_seconds)}</div>
                                </div>
                                <div className="infos">
                                    <div className="title">{video.title}</div>
                                    <div className="name_chaine">{video.profiles?.username}</div>
                                    <div className="views_time">
                                        {formatViews(video.views_count)} views <span>.</span> {formatDate(video.created_at)}
                                    </div>
                                </div>
                            </a>
                        ))}

                    </div>
                </div>

            </div>
        </div>
    )
}

export default WatchPage
