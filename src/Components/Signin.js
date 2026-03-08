import React, { useState, useContext, useEffect } from 'react';
import './signin.css';
import { Link } from 'react-router-dom';
import { supabase } from '../client';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import toast from 'react-hot-toast';

function Signin() {
    const navigate = useNavigate()
    const { session, setSession, user, setUser, logout } = useContext(AuthContext);
     

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [errors, setErrors] = useState({});

    /***************************************Handle Input Value***************************************/
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
 
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const updatedData = {...prev, [name]: value};

            // simple check
            const allFilled = updatedData.email && updatedData.password 

            setIsSubmitDisabled(!allFilled);

            return updatedData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        /***********************************************validation de email, password***********************************************/
        if (!/\S+@\S+\.\S+/.test(formData.email)) {newErrors.email = "Email invalide";}

        if (formData.password.length < 6) { newErrors.password = "Minimum 6 caractères";}
        /***********************************************validation de email, password***********************************************/

        setErrors(newErrors);

        // stop submit if errors
        if (Object.keys(newErrors).length > 0) {
            setIsSubmitDisabled(true);
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email   : formData.email,
            password: formData.password,
        })
        if(error){toast.error(error.message); setIsSubmitDisabled(true); return}
        else{
            setFormData({
                email: '',
                password: '',
            })
            setIsSubmitDisabled(true);
            toast.success("Log in successed")
            setUser(data.user)
            setSession(data.session)
            navigate("/home")
        }
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
        width: 500,
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
        <div className="sign_container" style={{marginTop:"2.5em"}}>
        <div className="sign_left_content">
            <div className="slang">
            <h1>
                Regarde ce que tout le monde regarde et plonge dans{" "}
                <span>le contenu qui fait le buzz</span>.
            </h1>
            <img src="assets/slang_image.png" alt="slang_img" />
            </div>
        </div>

        <div className="sign_right_content">
            <h1>Se connecter à <span style={{color:"var(--primary-color)"}}>SenTube</span></h1>

            <form className='form_signin' onSubmit={handleSubmit}>
            {/* Email */}
            <TextField
                id="outlined-email"
                label="Your Email"
                variant="outlined"
                name="email"
                value={formData.email}
                error={Boolean(errors.email)}
                helperText={errors.email}
                onChange={handleInputChange}
                sx={inputStyles}
            />

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

            <button className='submit_form_btn' type='submit' disabled={isSubmitDisabled} >Se connecter</button>
            </form>

            <div className='linking_sign_pages'>
                <p>Vous n’avez pas de compte ?</p>
                <Link to="/signup" style={{textDecoration:"none"}}>
                    <span>Inscrivez-vous</span>
                </Link>
            </div>
        </div>
        </div>
    );
}

export default Signin;
