import React, { useState, useEffect, useContext } from 'react';
import './signup.css';
import { Link } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';


import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateField } from '@mui/x-date-pickers/DateField';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '../client';
import toast from 'react-hot-toast';

function Signup() {
    const navigate = useNavigate()
    const { session, setSession, user, setUser, logout } = useContext(AuthContext);
    
    const [isSubmitDisabled, setSubmitDisabled] = useState(true);
    const [errors, setErrors] = useState({});


    /***************************************Handle Input Value***************************************/
    const [formData, setFormData] = useState({
        nom:'',
        prenom:'',
        username:'',
        date_naissance:'',
        avatar:null,
        email: '',
        confirm_password: '',
        password: '',
    });

    useEffect(() => {
        const allFilled = formData.nom && formData.prenom && formData.username && formData.email 
                          && formData.password && formData.confirm_password && formData.date_naissance 
                          && formData.avatar;
        setSubmitDisabled(!allFilled);
    }, [formData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name]: value})
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        
        /***********************************************validation de email, password, Image***********************************************/
        const newErrors = {};

        if (!/\S+@\S+\.\S+/.test(formData.email)) {newErrors.email = "Email invalide";}

        if (formData.password.length < 6) { newErrors.password = "Minimum 6 caractères";} 
        else if(formData.password !== formData.confirm_password){
            newErrors.password = "Les mots de passe ne correspondent pas";
        }

        if(formData.avatar){
            if (!["image/png", "image/jpeg", "image/jpg"].includes(formData.avatar.type)) {
                newErrors.avatar = "Formats acceptés: PNG, JPG, JPEG";
            }else if(formData.avatar.size > 10*1024*1024){
                newErrors.avatar  = "Maximum taille est 10 Mg"
            }
        }

        setErrors(newErrors);

        // stop submit if errors
        if (Object.keys(newErrors).length > 0) {
            setSubmitDisabled(true);
            return;
        }
        /***********************************************validation de email, password***********************************************/

        /**upload avaatr to bucket storage in supabase*/
        const fileExt  = formData.avatar.name.split('.').pop()?.toLowerCase()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const {data:uploadData, error:uploadError} = await supabase.storage.from("AVATAR").upload(`${fileName}`, formData.avatar)
        if(uploadError){
            toast.error(uploadError.message)
            return
        }
        const avatar_url = supabase.storage.from("AVATAR").getPublicUrl(`${fileName}`).data.publicUrl

        
        /**creer une utilisateur */
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nom           : formData.nom,
                    prenom        : formData.prenom,
                    username      : formData.username,
                    date_naissance: formData.date_naissance,
                    avatar_url    : avatar_url,
            }}
        })

        if(error){
            toast.error(error.message)
            console.log(error)
            return
        }
        if (data.session) {
            setSession(data.session)
            setUser(data.user)
        }
        setFormData({
            nom:'',
            prenom:'',
            username:'',
            date_naissance:'',
            avatar: null,
            email: '',
            confirm_password: '',
            password: '',
        })
        navigate("/")
        toast('Check your email to confirm your account',
        {
            icon: '👏',
            style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            },
        }
        );
    };

    /***************************************Handle Input Value***************************************/

    /*****************************************Password Input*****************************************/
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };
    /*****************************************Password Input*****************************************/


    const inputStyles = {
        width: "100%",
        marginBottom: 2,
        "& .MuiInputLabel-root": {
        color: "var(--black-color)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
        color: "var(--black-color)",
        },
        "& .MuiOutlinedInput-input": {
        color: "var(--black-color)",
        },
        "& .MuiOutlinedInput-root": {
        backgroundColor: "transparent",
        "& fieldset": {
            borderColor: "gray",
        },
        "&:hover fieldset": {
            borderColor: "var(--black-color)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "var(--black-color)",
        },
        },
    };

    return (
        <div className="signup_container" style={{marginTop:"4em"}}>
        <div className="signup_header">
            <h1>Lancez-vous sur <span>SenTube</span> .</h1>
            <p>Inscrivez-vous pour voir et publier vos vidéos.</p>
        </div>

        <div className="form_signup_container">
            <form className='form_signup' onSubmit={handleSubmit}>
            {/* nom prenom email username */}
            <TextField
                id="outlined-nom"
                label="Votre nom"
                variant="outlined"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                sx={inputStyles}
            />
            <TextField
                id="outlined-prenom"
                label="Votre prenom"
                variant="outlined"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                sx={inputStyles}
            />
            <TextField
                id="outlined-username"
                label="Votre username"
                variant="outlined"
                name="username"
                error={Boolean(errors.username)}
                helperText={errors.username}
                value={formData.username}
                onChange={handleInputChange}
                sx={inputStyles}
            />
            <div className="file-wrapper" style={errors.avatar ? {borderColor:"#d32f2f"} : null}>
                <label htmlFor="file_pic" className="file-btn">
                    Choisir Votre Image
                </label>

                <span className="file-name">
                    {formData.avatar
                    ? formData.avatar.name
                    : "No file chosen"}
                </span>

                <input
                    type="file"
                    id="file_pic"
                    name="avatar"
                    hidden
                    onChange={(e) => {
                    const file = e.target.files[0];
                    setFormData(prev => ({
                        ...prev,
                        avatar: file || null
                    }));
                    }}
                />
            </div>
            {errors.avatar && (
                <p style={{ color: "#d32f2f", marginBottom:"20px", paddingLeft:"10px", fontSize:".76rem" }}>{errors.avatar}</p>
            )}


            <TextField
                id="outlined-email"
                label="Votre email"
                variant="outlined"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                sx={inputStyles}
                error={Boolean(errors.email)}
                helperText={errors.email}
            />
            {/* nom prenom email username */}

            {/* date de naissance */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateField
                    label="Date de naissance"
                    format="YYYY-MM-DD"
                    name="date_naissance"
                    value={formData.date_naissance ? dayjs(formData.date_naissance) : null}
                    onChange={(newValue) => {
                    setFormData((prevData) => ({
                        ...prevData,
                        date_naissance: newValue ? newValue.format('YYYY-MM-DD') : ''
                    }));
                    }}
                    sx={inputStyles}
                
                />
            </LocalizationProvider>
            {/* date de naissance */}

            {/* Password */}
            <FormControl variant="outlined" sx={inputStyles} error={Boolean(errors.password)}>
                <InputLabel htmlFor="outlined-password">
                Password
                </InputLabel>

                <OutlinedInput
                id="outlined-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                endAdornment={
                    <InputAdornment position="end">
                    <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                        edge="end"
                        sx={{ color: "var(--black-color)" }}
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    </InputAdornment>
                }
                />
                {errors.password && (
                    <FormHelperText>{errors.password}</FormHelperText>
                )}
            </FormControl>

            <FormControl variant="outlined" sx={inputStyles} error={Boolean(errors.password)}>
                <InputLabel htmlFor="outlined-confirm-password">
                Confirm Password
                </InputLabel>

                <OutlinedInput
                id="outlined-confirm-password"
                type={showPassword ? 'text' : 'password'}
                label="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                endAdornment={
                    <InputAdornment position="end">
                    <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                        edge="end"
                        sx={{ color: "var(--black-color)" }}
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    </InputAdornment>
                }
                />
                {errors.password && (
                    <FormHelperText>{errors.password}</FormHelperText>
                )}
            </FormControl>

            <button className='submit_form_btn' type='submit' disabled={isSubmitDisabled} >S'inscrire</button>
            </form>

            <div className='linking_sign_pages'>
                <p>Vous avez déjà un compte ?</p>
                <Link to="/" style={{textDecoration:"none"}}>
                    <span>Connectez-vous</span>
                </Link>
            </div> 
        </div>
        </div>
    );
}

export default Signup;
