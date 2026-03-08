import { useState, useContext, useCallback } from 'react';
import { AuthContext } from "../Context/AuthContext";

import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import './ModalCreationVideo.css'
import { supabase } from '../client';
import toast from 'react-hot-toast';

function ModalCreationVideo({ open, setOpen }) {
    const { user } = useContext(AuthContext);

    // ─────────────────── STATE ───────────────────
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [thumbnail, setThumbnail] = useState(null);
    const [video, setVideo] = useState(null);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ─────────────────── DERIVED STATE ───────────────────
    const isSubmitDisabled = !(
        title  &&  description &&  thumbnail &&  video &&  !loading
    );

    // ─────────────────── HELPERS ───────────────────
    const resetFormData = useCallback(() => {
        setTitle(""); setDescription(""); setThumbnail(null); setVideo(null); setDurationSeconds(0); setErrors({}); setUploadProgress(0);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false); resetFormData();
    }, [resetFormData, setOpen]);

    const getVideoDuration = (file) =>
        new Promise((resolve, reject) => {
            const videoEl = document.createElement("video");
            const url = URL.createObjectURL(file);

            videoEl.preload = "metadata";
            videoEl.src = url;

            videoEl.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                resolve(Math.round(videoEl.duration));
            };

            videoEl.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Metadata error"));
            };
        });

    // ─────────────────── HANDLERS ───────────────────
    const handleInputChange = async (e) => {
        const { name, value, files, type } = e.target;

        if (type === "file" && files?.[0]) {
            const file = files[0];

            if (name === "thumbnail") {
                setThumbnail(file);
                return;
            }

            if (name === "video") {
                try {
                    const duration = await getVideoDuration(file);
                    setVideo(file);
                    setDurationSeconds(duration);
                } catch {
                    toast.error("Could not read video duration");
                }
                return;
            }
        }

        if (name === "title") setTitle(value);
        if (name === "description") setDescription(value);
    };

    const validateFiles = () => {
        const newErrors = {};

        if (thumbnail) {
            if (thumbnail.size > 10 * 1024 * 1024) { newErrors.thumbnail = "Maximum size of thumbnail is 10 MB"; } 
            else if (!["image/png", "image/jpeg"].includes(thumbnail.type)) { newErrors.thumbnail = "Please upload a PNG or JPG image"; }
        }

        if (video) {
            if (video.size > 50 * 1024 * 1024) { newErrors.video = "Maximum size of video is 50 MB"; } 
            else if (!video.type.includes("mp4")) { newErrors.video = "Please upload an MP4 video"; }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateFiles()) return;

        setLoading(true); setUploadProgress(0);

        try {
            const thumbExt = thumbnail.name.split('.').pop();
            const videoExt = video.name.split('.').pop();

            const thumbName = `${user.id}/${crypto.randomUUID()}.${thumbExt}`;
            const videoName = `${user.id}/${crypto.randomUUID()}.${videoExt}`;

            // ───────── Thumbnail upload (0 → 20%) ─────────
            const thumbRes = await supabase.storage
                .from('THUMBNAIL')
                .upload(thumbName, thumbnail);
            if (thumbRes.error) throw thumbRes.error;
            setUploadProgress(20)

            // ───────── Video upload (20 → 90%) ─────────
            const videoRes = await supabase.storage
                .from('VIDEOS')
                .upload(videoName, video);
            if (videoRes.error) throw videoRes.error;
            setUploadProgress(80)

            const thumbnail_url =
                supabase.storage.from('THUMBNAIL').getPublicUrl(thumbName).data.publicUrl;

            const video_url =
                supabase.storage.from('VIDEOS').getPublicUrl(videoName).data.publicUrl;

            // ───────── DB insert (90 → 100%) ─────────
            const { error } = await supabase.from('videos').insert([{
                user_id: user.id,
                title,
                description,
                thumbnail_url,
                video_url,
                duration_seconds: durationSeconds
            }]);
            if (error) throw error;
            setUploadProgress(100);  await new Promise(res => setTimeout(res, 400));
            toast.success("Video uploaded successfully!"); handleClose();

        } 
        catch (err) { toast.error(err.message || "Upload failed"); } 
        finally { setLoading(false); }
    };


    // ─────────────────── JSX (UNCHANGED) ───────────────────
    return (
        <Dialog open={open} onClose={loading ? undefined : handleClose} className='dialog'>
            <DialogTitle>
                <div className='dialog_header' style={{display:"flex", justifyContent:"space-between", alignContent:"center"}}>
                    <p>Importer des videos</p>
                    <button className='dialog_close' onClick={loading ? undefined : handleClose} disabled={loading}>
                        <CloseIcon/>
                    </button>
                </div>
            </DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit} id="subscription-form">
                    <TextField
                        id="outlined-required"
                        label="Title"
                        name="title"
                        color='var(--black-color)'
                        margin="normal"
                        value={title}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <TextField
                        id="outlined-multiline-static"
                        label="Description"
                        name="description"
                        multiline
                        rows={2}
                        color='var(--black-color)'
                        margin="normal"
                        value={description}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <div className="file-wrapper" style={errors.thumbnail ? {borderColor:"#d32f2f"} : null}>
                        <label htmlFor="file_pic" className="file-btn">
                            Choisir Thumbnail
                        </label>

                        <span className="file-name">
                            {thumbnail?.name || "No file chosen"}
                        </span>

                        <input
                            type="file"
                            id="file_pic"
                            name="thumbnail"
                            hidden
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    {errors.thumbnail && (
                        <p style={{ color: "#d32f2f", marginBottom:"20px", paddingLeft:"10px", fontSize:".76rem" }}>
                            {errors.thumbnail}
                        </p>
                    )}

                    <div className="file-wrapper" style={errors.video ? {borderColor:"#d32f2f"} : {}}>
                        <label htmlFor="file_video" className="file-btn">
                            choisir video
                        </label>

                        <span className="file-name">
                            {video?.name || "No file chosen"}
                            {durationSeconds > 0 && ` (${durationSeconds}s)`}
                        </span>

                        <input
                            type="file"
                            id="file_video"
                            name="video"
                            accept="video/mp4,video/*"
                            hidden
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    {errors.video && (
                        <p style={{ color: "#d32f2f", marginBottom:"20px", paddingLeft:"10px", fontSize:".76rem" }}>
                            {errors.video}
                        </p>
                    )}
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={resetFormData} className='reset' disabled={loading}>reset</Button>
                <Button
                    type="submit"
                    form="subscription-form"
                    disabled={isSubmitDisabled || loading}
                    className='submit'
                >
                    confimer
                </Button>
            </DialogActions>
            {loading && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ height: "6px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden", width:"90%", margin:"auto" }}>
                        <div style={{height: "100%", width: `${uploadProgress}%`, background: "#1976d2", transition: "width 0.25s ease"}} />
                    </div>
                    <p style={{ fontSize: ".75rem", marginTop: "6px", marginLeft:"5%" }}>
                        {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Finalizing…"}
                    </p>
                </div>
            )}
        </Dialog>
    );
}

export default ModalCreationVideo;
