import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
function ProtectedRoute({children}:{children:React.ReactNode}){
     const {accessToken,isInitializing}=useContext(AuthContext);
     if(isInitializing){
        return <p>Loading..</p>;
     }
     if(!accessToken){
        return <Navigate to="/login" replace/>
     }
     return children;

}
export default ProtectedRoute;