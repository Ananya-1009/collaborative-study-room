import {useState,useContext} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
function LoginPage(){
    const navigate=useNavigate();
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [error,setError]=useState("");
    const {login}=useContext(AuthContext);
    
    async function handleSubmit(event:React.FormEvent){
        event.preventDefault();
        setError("");
        try{
            await login(email,password);
            navigate("/dashboard");
            console.log("Login successful");
        }catch(error){
            if(error instanceof Error){
                setError(error.message);
            }else{
                setError("Login failed");
            }
        }
    }
    return(
        <div className="login-page">
            <div className="login-left">
                <div className="brand">
                <div className="brand-name">Study<span>Room</span></div>
                    <p>FOCUS · COLLABORATE · GROW</p>
                </div>
                <div className="login-intro">
                    <p className="intro-label">A BETTER WAY TO STUDY TOGETHER</p>
                    <h2>
                        Study together.
                        <br/>
                        Stay focused.
                        <br/>
                        Make progress.
                    </h2>
                    <p className="intro-text">
                        Create a focuse space where you and your friends can study,collabrate, and make progress together.
                    </p>
                    <div className="intro-features">
                    <div>
                        <span className="feature-dot"></span>
                        Shared study sessions
                    </div>

                    <div>
                        <span className="feature-dot"></span>
                        Real-time collaboration
                    </div>
                    <div className="intro-preview">
                    <div className="preview-card">
                        <span>FOCUS SESSION</span>
                        <strong>25:00</strong>
                    </div>

                    <div className="preview-card">
                        <span>STUDY TOGETHER</span>
                        <div className="preview-people">
                        <i></i>
                        <i></i>
                        <i></i>
                        <b>+2</b>
                        </div>
                    </div>
                    </div>
                    <div>
                        <span className="feature-dot"></span>
                        Track your progress
                    </div>
                    </div>
                </div>
            </div>

            <div className="login-right">
            <div className="login-card">
                <h1>Welcome Back</h1>
                <p className="login-subtitle">
                    Join your study room and stay foucsed.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event)=>setEmail(event.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event)=>setPassword(event.target.value)}
                    />
                    </div>
                    <div className="login-options">
                    <label>
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>
                    <button type="button" className="forgot-password">
                        Forgot password?
                    </button>
                    </div>
                    <button type="submit">
                        Login
                    </button>
                    <div className="register-prompt">
                        <span>Don't have an account?</span>
                        <button type="button" className="register-link"
                        onClick={()=>navigate("/register")}>
                            Register
                        </button>
                    </div>
                </form>
                {error && <p className="login-error">{error}</p>}
            </div>
        </div>
        </div>
    );
}
export default LoginPage;