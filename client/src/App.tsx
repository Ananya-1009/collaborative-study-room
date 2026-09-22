import {BrowserRouter,Routes,Route} from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import StudyRoomPage from "./pages/StudyRoomPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/dashboard" 
        element={<ProtectedRoute>
          <DashboardPage/>
          </ProtectedRoute>}/>
        <Route path="/rooms/:roomCode" element={<StudyRoomPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage />}/>
      </Routes>
      </BrowserRouter>
    </AuthProvider>
    
  );
}
export default App;