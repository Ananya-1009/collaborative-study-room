import RoomCard from "../components/RoomCard";
import CreateRoomForm from "../components/CreateRoomForm";
import { useEffect,useState } from "react";
type Room = {
    id:number,
    name: string;
    topic: string;
    code: string;
};
function DashboardPage(){
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try{
                const response=await fetch("http://localhost:5000/api/rooms");
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const data = await response.json();
                setRooms(data);
            }
            catch(error){
                setError("ERROR IN LOADING DATA")
            }
            finally{
                setIsLoading(false)
            }
        }
        fetchData();
    }, []);
    async function handleCreateRoom(roomName: string, topic: string) {
        const response= await fetch("http://localhost:5000/api/rooms",{
            method:"Post",
            headers:{
                "Content-Type":"application/json",
            },
            body: JSON.stringify({
                name:roomName,
                topic:topic,
            }),
        });
        const data:Room=await response.json();
        setRooms((currentRooms) => [...currentRooms, data]);
        console.log(data)
    }
    return(
        <div>
            <h1>Dashboard</h1>
            <CreateRoomForm onCreateRoom={handleCreateRoom} />
            <h2>Your Rooms</h2>
            {isLoading && <p>Loading rooms...</p>}
            {error && <p>{error}</p>}
            {rooms.map((room) => (
            <RoomCard
                key={`${room.name}-${room.topic}`}
                name={room.name}
                topic={room.topic}
                code={room.code}
            />
            ))}
        </div>
        
    );
}

export default DashboardPage;