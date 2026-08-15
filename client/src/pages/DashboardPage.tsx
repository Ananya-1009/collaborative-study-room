import RoomCard from "../components/RoomCard";
import CreateRoomForm from "../components/CreateRoomForm";
import { useEffect,useState } from "react";
type Room = {
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
                const response = await fetch(
                    "https://jsonplaceholder.typicode.com/posts"
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const data = await response.json();
                console.log(data);
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
    function handleCreateRoom(roomName: string, topic: string) {
    const newRoom: Room = {
        name: roomName,
        topic: topic,
        code: "ABC123",
    };
    setRooms([...rooms, newRoom]);
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