import { useEffect,useState,useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
type CreateRoomFormProps = {
  onCreateRoom: (roomName: string, topic: string) => void;
};
function CreateRoomForm({ onCreateRoom }: CreateRoomFormProps){
    const [roomName,setRoomName]=useState("");
    const [topic,setTopic]=useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showJoinForm,setShowJoinForm]=useState(false);
    const [roomCode,setRoomCode]=useState("");
    const { accessToken } = useContext(AuthContext);
    const navigate = useNavigate();
    function handleSubmit(event:React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        if(!roomName || !topic){
            setError("Please enter room name and topic");
            return;
        }
        setIsLoading(true);
        onCreateRoom(roomName, topic);
        setTimeout(() => {
        setIsLoading(false);}, 1000);
    }
    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Study Room</h2>
            <input type="text" placeholder="Enter room name" value={roomName} onChange={(event) => {setRoomName(event.target.value);
                setError("");}
            }/>
            <input type="text" placeholder="Enter topic" value={topic} onChange={(event) => {setTopic(event.target.value);setError("");}}/>
            <button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Room"}</button>
            <button onClick={()=>setShowJoinForm(true)}>
                Join Room
            </button>
            {showJoinForm && (
                <div>
                    <h3>Join a Study Room</h3>
                    <input
                    type="text"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(event)=>setRoomCode(event.target.value)}/>
                    <button onClick={async()=>{
                        try{
                        const response=await fetch(
                            "http://localhost:5000/api/rooms/join",
                            {
                                method:"POST",
                                headers:{
                                    "Content-Type":"application/json",
                                    Authorization:`Bearer ${accessToken}`,
                                },
                                body: JSON.stringify({
                                    code:roomCode,
                                }),
                            }
                        );
                        const data=await response.json();
                        console.log("Join room response:",data);
                        if(!response.ok){
                            console.error("Failed to join room:",data.error);
                            return;
                        }
                        console.log("Successfully joined room!");
                        navigate(`/rooms/${roomCode}`);
                        }catch(error){
                            console.error("Join room request failed:",error);
                        }
                    
                    }}>
                        Join
                    </button>
                    <button>
                        Cancel
                    </button>
                </div>
            )}
            {error && <p>{error}</p>}
        </form>
    );
}
export default CreateRoomForm;