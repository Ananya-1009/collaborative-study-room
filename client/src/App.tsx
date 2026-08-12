import {BrowserRouter,Routes,Route} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import StudyRoomPage from "./pages/StudyRoomPage";
function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/rooms/:roomCode" element={<StudyRoomPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}
export default App;