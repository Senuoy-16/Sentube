import { useState, useEffect, createContext } from "react";
import { supabase } from "../client";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile including avatar
    const fetchProfile = async (userId) => {
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("avatar_url, username, nom, prenom")
            .eq("user_id", userId)
            .single();

        if (error) return null;
        return profile;
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        const {data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/");
        toast.success("you logged out")
    };

    return (
        <AuthContext.Provider value={{ session, setSession, user, setUser, logout, fetchProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
