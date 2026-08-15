import { useEffect,useState } from "react";
type CreateRoomFormProps = {
  onCreateRoom: (roomName: string, topic: string) => void;
};
function CreateRoomForm({ onCreateRoom }: CreateRoomFormProps){
    const [roomName,setRoomName]=useState("");
    const [topic,setTopic]=useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
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
            {error && <p>{error}</p>}
        </form>
    );
}
export default CreateRoomForm;