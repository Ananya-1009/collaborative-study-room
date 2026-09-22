import { useNavigate } from "react-router-dom";
import { useState } from "react";
function RegisterPage(){
    const navigate = useNavigate();
    const [username,setUsername]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [error,setError]=useState("");
    async function handleRegister(event:React.FormEvent<HTMLFormElement>){
        event?.preventDefault();
        setError("");
        try{
            const response=await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                    },
                    body:JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );
            const data=await response.json();
            if(!response.ok){
                setError(data.error || "Registration failed");
                return;
            }
            console.log("Registration successful:",data);
            navigate("/login");
        }catch(error){
            setError("Unable to connect to the server");
        }
    }
    return(
        <div className="login-page">
            <div className="login-left">
                <div className="brand">
                    <div className="brand-name">
                        Study<span>Room</span>
                    </div>
                    <p>FOCUS · COLLABORATE · GROW</p>
                </div>
                <div className="login-intro">
                    <p className="intro-label">START YOUR STUDY JOURNEY</p>
                    <h2>
                        Create your space.
                        <br />
                        Study together.
                        <br />
                        Grow together.
                    </h2>
                    <p className="intro-text">
                        Create an account and join focused study sessions with friends and classmates.
                    </p>
                    <div className="intro-features">
                        <div>
                            <span className="feature-dot"></span>
                            Create and join study rooms
                        </div>
                        <div>
                            <span className="feature-dot"></span>
                            Collabrate in real time
                        </div>
                        <div>
                            <span className="feature-dot"></span>Track your study progress
                        </div>
                    </div>
                </div>
            </div>
            <div className="login-right">
                <div className="login-card">
                    <h1>Create account</h1>
                    <p className="login-subtitle">
                        Join StudyRoom and start studying together.
                    </p>
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}/>
                        </div>
                        {error && (
                            <p className="login-error">
                                {error}
                            </p>
                        )}
                        <button type="submit">
                            Create account
                        </button>
                    </form>
                    <div className="register-prompt">
                        <span>Already have an account?</span>
                        <button type="button" className="register-link"
                        onClick={() => navigate("/login")}>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default RegisterPage