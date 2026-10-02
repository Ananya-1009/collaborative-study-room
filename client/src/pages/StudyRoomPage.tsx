import { useContext,useEffect,useState,useRef} from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {io} from "socket.io-client";
function StudyRoomPage(){
    const {roomCode}=useParams();
    const{accessToken,isInitializing,user}=useContext(AuthContext);
    const socketRef=useRef<any>(null);
    useEffect(()=>{
        if(isInitializing || !accessToken){
            return;
        }
        const socket=io("http://localhost:5000",{
            auth:{
                token:accessToken,
            },
        });
        socketRef.current=socket;
        socket.on("connect",()=>{
            console.log("Connected to Socket.IO",socket.id);
            socket.emit("join-room",roomCode);
        });
        socket.on("online-users", (userIds: number[]) => {
            console.log("ONLINE USERS EVENT:", userIds);

            setParticipants((currentParticipants)=>
            currentParticipants.map((participant)=>({
                ...participant,
                online:userIds.includes(Number(participant.id)),
            })))
        });
        socket.on("user-joined", (data) => {
        console.log("USER JOINED:", data);
        setParticipants((currentParticipants)=>{
            const alreadyExists=currentParticipants.some((participant)=>participant.id===data.userId);
            if(alreadyExists){
                return currentParticipants.map((participant)=>
                participant.id===data.userId
                ?{...participant,online:true}
                :participant
            );
        }
        return [
            ...currentParticipants,
            {
                id:data.userId,
                username:data.username,
                online:true,
            },
        ];
        });
        });
        socket.on("session-started",(data)=>{
            setActiveSession(data.session);
        });
        socket.on("session-ended",()=>{
            setActiveSession(null);
        })
        socket.on("connect_error",(error)=>{
            console.error("Socket connection failed:",error.message);
        });
        socket.on("user-left", (data) => {
            setParticipants((currentParticipants)=>
            currentParticipants.map((participant)=>
            participant.id===data.userId
        ?{...participant,online:false}:participant));
        });
        socket.on("new-message",(data)=>{
            console.log("NEW MESSAGE:",data);
            setMessages((currentMessages)=>[
                ...currentMessages,
                data,
            ]);
        });
        socket.on("new-resource",(data)=>{
            setResources((currentResources)=>[
                ...currentResources,
                data,
            ]);
        });
        socket.on("new-problem",(data)=>{
            setProblems((currentProblems)=>[
                ...currentProblems,
                data,
            ]);
        });
        socket.on("problem-completed",(data)=>{
            if(data.userId!==user?.id){
                return;
            }
            setProblems((currentProblems)=>
            currentProblems.map((problem)=>
                problem.id===data.problemId?{...problem,completed:true}:problem
            ));
        });
        return ()=>{
            socket.disconnect();
        };
    },[accessToken,isInitializing]);
    const [room,setRoom]=useState<any>(null);
    const [error,setError]=useState("");
    const [participants,setParticipants]=useState<{id:Number;username:string;online:boolean}[]>([]);
    const [message, setMessage] = useState("");
    const [messages,setMessages]=useState<{userId:number;username:string;content:string}[]>([]);
    const [activeSession,setActiveSession]=useState<{
        id:number;
        room_id:number;
        started_by:number;
        started_at:string;
        ended_at:string|null;
    }|null>(null);
    const [elapsedSeconds,setElapsedSeconds]=useState(0);
    const [resources,setResources]=useState<{
        id:Number;
        title:string;
        url:string|null;
        resource_type:string;
        added_by:Number;
        created_at:string;
    }[]>([]);
    const [resourceTitle,setResourceTitle]=useState("");
    const [resourceUrl,setResourceUrl]=useState("");
    const [resourceType,setResourceType]=useState("link");
    const [pdfFile,setPdfFile]=useState<File | null>(null);
    const [pdfTitle,setPdfTitle]=useState("");
    const [problems,setProblems]=useState<{
        id:number;
        title:string;
        url:string | null;
        difficulty:string;
        topic:string;
        added_by:number;
        created_at:string;
        completed:boolean;
    }[]>([]);
    const [problemTitle,setProblemTitle]=useState("");
    const [problemUrl,setProblemUrl]=useState("");
    const [problemDifficulty,setProblemDifficulty]=useState("Easy");
    const [problemTopic,setProblemTopic]=useState("");
    async function handleAddProblem(event: React.FormEvent){
        event.preventDefault();
        if(!problemTitle.trim() || !problemTopic.trim()){
            return;
        }
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/problems`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        Authorization:`Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        title:problemTitle.trim() || null,
                        url: problemUrl.trim() || null,
                        difficulty:problemDifficulty,
                        topic:problemTopic.trim(),
                    }),
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed tp add problem:",data.error);
                return;
            }
            setProblemTitle("");
            setProblemUrl("");
            setProblemDifficulty("Easy");
            setProblemTopic("");
        }catch(error){
            console.error("Failed to add problem:",error);
        }
    }
    async function handleUploadPdf(event:React.FormEvent){
        event.preventDefault();
        if(!pdfFile){
            return;
        }
        const formData=new FormData();
        formData.append("file",pdfFile);
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/resources/upload`,
                {
                    method:"POST",
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                    body:formData,
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to upload PDF:",data.error);
                return;
            }
            setResources((currentResources)=>[
                ...currentResources,
                data,
            ]);
            setPdfFile(null);
            setPdfTitle("");
        }catch(error){
            console.error("Failed to upload PDF:",error);
        }
    }
    async function handleCompleteProblem(problemId:number){
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/problems/${problemId}/complete`,
                {
                    method:"POST",
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to complete problem:",data.error);
                return;
            }
            setProblems((currentProblems)=>
            currentProblems.map((problem)=>
            problem.id===problemId ?{...problem,completed:true}:problem));
        }catch(error){
            console.error("Failed to complete problem:",error);
        }
    }
    async function handleAddResource(event:React.FormEvent){
        event.preventDefault();
        if(!resourceTitle.trim()){
            return;
        }
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/resources`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        Authorization:`Bearer ${accessToken}`,
                    },
                    body:JSON.stringify({
                        title:resourceTitle.trim(),
                        url:resourceUrl.trim() || null,
                        resource_type:resourceType,
                    }),
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to add resources:",data.error);
                return;
            }
            setResources((currentResources)=>[
                ...currentResources,
                data,
            ]);
            setResourceTitle("");
            setResourceUrl("");
            setResourceType("link");
        }catch(error){
            console.error("Failed to add resource:",error);
        }
    }
    useEffect(()=>{
        async function fetchProblems(){
            try{
                const response=await fetch(
                    `http://localhost:5000/api/rooms/${room.id}/problems`,
                    {
                        headers:{
                            Authorization:`Bearer ${accessToken}`,
                        },
                    }
                );
                const data=await response.json();
                if(!response.ok){
                    console.error("Failed to fetch problems:",data.error);
                    return;
                }
                setProblems(data);
            }catch(error){
                console.error("Failed to fetch problems:",error);
            }
        }
        if(accessToken && room){
            fetchProblems();
        }
    },[accessToken,room]);
    useEffect(()=>{
        async function fetchResources() {
            try{
                const response=await fetch(
                    `http://localhost:5000/api/rooms/${room.id}/resources`,
                    {
                        headers:{
                            Authorization:`Bearer ${accessToken}`,
                        },
                    }
                );
                const data=await response.json();
                if(!response.ok){
                    console.error("Failed to fetch resources:",data.error);
                    return;
                }
                setResources(data);
            }catch(error){
                console.error("Failed to fetch resources:",error);
            }
        }
        if(accessToken && room){
            fetchResources();
        }
    },[accessToken,room]);
    useEffect(()=>{
        if(!activeSession){
            setElapsedSeconds(0);
            return;
        }
        const session=activeSession;
        function updateElapsedTime(){
            const startTime=new Date(session.started_at).getTime();
            const currentTime=Date.now();
            const elapsed=Math.floor((currentTime-startTime)/1000);
            setElapsedSeconds(elapsed);
        }
        updateElapsedTime();
        const interval=setInterval(updateElapsedTime,1000);
        return ()=>{
            clearInterval(interval);
        }
    },[activeSession]);
    useEffect(()=>{
        async function fetchActiveSession(){
            try{
                const response=await fetch(
                    `http://localhost:5000/api/rooms/${room.id}/sessions/active`,{
                        headers:{
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                const data=await response.json();
                if(!response.ok){
                    console.error("Failed to fetch active session:",data.error);
                    return;
                }
                setActiveSession(data);
            }catch(error){
                console.error("Failed to fecth active session:",error);
            }
        }
        if(accessToken && room){
            fetchActiveSession();
        }
    },[accessToken,room]);
    useEffect(()=>{
        
        async function fetchMessage(){
            try{
                console.log("ROOM ID FOR MESSAGES:", room.id);
                const response=await fetch(
                    `http://localhost:5000/api/rooms/${room.id}/messages`,
                    {
                        headers:{
                            Authorization:`Bearer ${accessToken}`,
                        },
                    }
                );
                const data=await response.json();
                if(!response.ok){
                    console.error("Failed to fetch messages:",data.error);
                    return;
                }
                setMessages(
                    data.map(
                        (message:{
                            user_id:number;
                            username:string;
                            content:string;
                        })=>({
                            userId:message.user_id,
                            username:message.username,
                            content:message.content,
                        })
                    )
                );
            }catch(error){
                console.error("Failed to fetch messages:",error);
            }
        }
        if(accessToken && room){
            fetchMessage();
        }
    },[[accessToken,room]]);
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
    useEffect(() => {
        console.log("CURRENT PARTICIPANTS STATE:", participants);
        }, [participants]);
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
            console.log("DATABASE PARTICIPANTS:", data);
            setParticipants(
            data.map((participant: { id: number; username: string }) => ({
                ...participant,
                online: false,
            }))
            );
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
    function handleSendMessage(event:React.FormEvent){
        event.preventDefault();
        if(!message.trim()){
            return;
        }
        socketRef.current?.emit("send-message",{
            roomCode,
            content:message.trim()
        });
        setMessage("");
    }
    async function handleStartSession(){
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/sessions/start`,{
                    method:"POST",
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to start session:",data.error);
                return;
            }
            setActiveSession(data);
            socketRef.current?.emit("session-started",{
                roomCode,
                session:data,
            });
        }catch(error){
            console.error("Failed to start session:",error);
        }
    }
    async function handleEndSession(){
        if(!activeSession){
            return;
        }
        try{
            const response=await fetch(
                `http://localhost:5000/api/rooms/${room.id}/sessions/${activeSession.id}/end`,
                {
                    method:"PATCH",
                    headers:{
                        Authorization:`Bearer ${accessToken}`,
                    },
                }
            );
            const data=await response.json();
            if(!response.ok){
                console.error("Failed to end session:",data.error);
                return;
            }
            setActiveSession(null);
            socketRef.current?.emit("session-ended",{
                roomCode,
            })
        }catch(error){
            console.error("Failed to end session:",error);
        }
    }
    function formatTime(totalSeconds:number){
        const minutes=Math.floor(totalSeconds/60);
        const seconds=totalSeconds%60;
        return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
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
                    {activeSession ? (
                    <>
                        <p>Session is active</p>
                        <p>Elapsed time: {formatTime(elapsedSeconds)} seconds</p>
                        <p>
                        Started at:{" "}
                        {new Date(activeSession.started_at).toLocaleTimeString()}
                        </p>
                        <button onClick={handleEndSession}>
                        End Study Session
                        </button>
                    </>
                    ) : (
                        <div>
                            <p>No active study session</p>
                            <p>Start one when everyone is ready.</p>
                            <button onClick={handleStartSession}>Start Study Session</button>
                        </div>
                    )}
            </header>
            <main className="study-room-content">
                <section className="study-main">
                    <form onSubmit={handleAddResource}>
                        <input
                        type="text"
                        placeholder="Resource title"
                        value={resourceTitle}
                        onChange={(event)=>setResourceTitle(event.target.value)}
                        />
                        <input 
                        type="url"
                        placeholder="Resource URL"
                        value={resourceUrl}
                        onChange={(event)=>setResourceUrl(event.target.value)}/>
                        <select
                        value={resourceType}
                        onChange={(event)=>setResourceType(event.target.value)}
                        >
                            <option value="link">Link</option>
                            <option value="pdf">PDF</option>
                            <option value="article">Article</option>
                            <option value="video">Video</option>
                        </select>
                        <button type="submit">
                            Add Resource
                        </button>
                    </form>
                    <form onSubmit={handleUploadPdf}>
                        <input type="file" accept="application/pdf" onChange={(event)=>{
                            setPdfFile(event.target.files?.[0]?? null);
                        }}
                        />
                        <button type="submit">
                            Upload PDF
                        </button>
                    </form>
                    <div className="study-panel">
                        <h2>Resources</h2>
                        {resources.length===0?(
                            <p>No resources yet.</p>
                        ):(
                        <div>
                        {resources.map((resource)=>(
                            <div key={Number(resource.id)}>
                            <strong>{resource.title}</strong>
                            <p>{resource.resource_type}</p>
                            {resource.resource_type==="pdf"?(
                                <div>
                                <a
                                href={
                                    resource.url?.startsWith("http")
                                    ? resource.url:`http://localhost:5000${resource.url}`
                                }
                                target="_blank"
                                rel="nonreferrer"
                                >
                                View
                                </a>
                                {" "}
                                <a
                                href={
                                    resource.url?.startsWith("http")?resource.url:`http://localhost:5000${resource.url}`
                                }
                                download>
                                    Download
                                    </a>
                                </div>
                            ):(
                                resource.url && (
                                    <a 
                                    href={resource.url}
                                    target="_blank"
                                    rel="nonreferrer">
                                        Open
                                    </a>
                                )
                            )}
                        </div>
                        ))}
                        </div>
                    )}
                    </div>
                    <form onSubmit={handleAddProblem}>
                        <input
                        type="text"
                        placeholder="Problem title"
                        value={problemTitle}
                        onChange={(event)=>setProblemTitle(event.target.value)}/>
                        <input
                        type="url"
                        placeholder="Problem URL"
                        value={problemUrl}
                        onChange={(event)=>setProblemUrl(event.target.value)}/>
                        <select 
                        value={problemDifficulty}
                        onChange={(event)=>
                            setProblemDifficulty(event.target.value)
                        }>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <input
                        type="text"
                        placeholder="Topic"
                        value={problemTopic}
                        onChange={(event)=>setProblemTopic(event.target.value)}/>
                        <button type="submit">
                            Add Problem
                        </button>
                    </form>
                    <div className="study-panel">
                        <h2>Study Problems</h2>
                        {problems.length===0?(
                            <p>No problems yet.</p>
                        ):(
                            <div>
                                {problems.map((problem)=>(
                                    <div key={problem.id}>
                                        <strong>{problem.title}</strong>
                                        <p>
                                            {problem.difficulty} · {problem.topic}
                                        </p>
                                        {problem.url && (
                                            <a 
                                                href={problem.url}
                                                target="_blank"
                                                rel="nonreferrer">Open Problem</a>
                                        )}
                                        <button type="button" onClick={()=>handleCompleteProblem(problem.id)}
                                        disabled={problem.completed}>
                                            {problem.completed?"Completed":"Mark as complete"}
                                        </button>
                                        </div>
                                ))}
                                </div>
                    )}
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
                           <p key={String(participant.id)}
                            style={{
                                color:participant.online?"green":"#171a3a",
                            }}>
                            {participant.username}
                           </p> 
                        ))}
                    </div>
                    <div className="study-panel chat-panel">
                        <h2>Chat</h2>
                        <div className="chat-messages">
                            {messages.length===0?(<p>No messages yet</p>):(
                                messages.map((message,index)=>(
                                    <p key={index}>
                                        <strong>{message.username} </strong>{message.content}
                                    </p>
                                ))
                            )}
                        </div>
                        <form className="chat-form" onSubmit={handleSendMessage}>
                            <input type="text" placeholder="Type a message..."
                            value={message}
                            onChange={(event)=>setMessage(event.target.value)}/>
                            <button type="submit">
                                Send
                            </button>
                        </form>
                    </div>
                </aside>
            </main>
        </div>
    );
}
export default StudyRoomPage;