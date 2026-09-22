import { useContext,useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {io} from "socket.io-client";
function StudyRoomPage(){
    const {roomCode}=useParams();
    const{accessToken,isInitializing}=useContext(AuthContext);
    useEffect(()=>{
        if(isInitializing || !accessToken){
            return;
        }
        const socket=io("http://localhost:5000",{
            auth:{
                token:accessToken,
            },
        });
        socket.on("connect",()=>{
            console.log("Connected to Socket.IO",socket.id);
            socket.emit("join-room",roomCode);
        });
        socket.on("user-joined",(data)=>{
            setParticipants((currentParticipants)=>{
                const alreadyExists=currentParticipants.some((participant)=>participant.id===data.userId);
                if(alreadyExists){
                    return currentParticipants;
                }
                return [
                    ...currentParticipants,
                    {
                        id:data.userId,
                        username:data.username,
                    },
                ];
            });
        });
        socket.on("connect_error",(error)=>{
            console.error("Socket connection failed:",error.message);
        });
        socket.on("user-left",(data)=>{
            setParticipants((currentParticipants)=>currentParticipants.filter(
                (participant)=>participant.id!==data.userId
            )
        );
        });
        return ()=>{
            socket.disconnect();
        };
    },[accessToken,isInitializing]);
    const [room,setRoom]=useState<any>(null);
    const [error,setError]=useState("");
    const [participants,setParticipants]=useState<{id:Number;username:string}[]>([]);
    useEffect(()=>{
        async function fetchRoom(){
            try{
                const response=await fetch(`http://localhost:5000/api/rooms/code/${roomCode}`,{
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                });
                const data =await response.json();
                if(!response.ok){
                    setError(data.error  || "Failed to load room");
                    return;
                }
                setRoom(data);
            }
            catch(error){
                setError("Unable to connect to server");
            }
        }
        if(accessToken && roomCode){
            fetchRoom();
        }
    },[accessToken,roomCode]);
    useEffect(()=>{
        async function fetchParticipants(){
            try{
                const response=await fetch(`http://localhost:5000/api/rooms/${room.id}/members`,
                {
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to fetch participants:",data.error);
                return;
            }
            setParticipants(data);
            }catch(error){
                console.error("Failed to fetch participants:",error);
            }
        }
        if(accessToken && room){
            fetchParticipants();
        }
    },[accessToken,room]);
    if(error){
        return <p>{error}</p>;
    }
    if(!room){
        return <p>Loading room...</p>
    }
    return(
        <div className="study-room">
            <header className="study-room-header">
                <div>
                    <h1>{room.name}</h1>
                    <p>{room.topic}</p>
                </div>
                <div className="room-code">
                    Room:<strong>{room.code}</strong>
                </div>
            </header>
            <main className="study-room-content">
                <section className="study-main">
                    <div className="study-panel">
                        <h2>Study Session</h2>
                        <p>Shared study tools will appear here.</p>
                    </div>
                    <div className="study-panel whiteboard-panel">
                        <h2>Whiteboard</h2>
                        <p>Collabrative whiteboard will appear here.</p>
                    </div>
                    <div className="study-panel">
                        <h2>Activity</h2>
                        <p>Real time activity will appear here</p>
                    </div>
                </section>
                <aside className="study-sidebar">
                    <div className="study-panel">
                        <h2>Participants</h2>
                        {participants.map((participant)=>(
                           <p key={String(participant.id)}>
                            {participant.username}
                           </p> 
                        ))}
                    </div>
                    <div className="study-panel">
                        <h2>Chat</h2>
                        <p>Real-time chat will appear here.</p>
                    </div>
                </aside>
            </main>
        </div>
    );
}
export default StudyRoomPage;