import { useNavigate } from "react-router-dom";
type RoomCardProps={
    name:string;
    topic: string;
    code: string;
};
function RoomCard({name,code,topic}:RoomCardProps){
    const navigate=useNavigate();
    return(
        <div className="room-card" onClick={()=>navigate(`/rooms/${code}`)}
        style={{ cursor: "pointer" }}>
        <h2>{name}</h2>
        <p>Room code: {code}</p>
        <p>Topic:{topic} members</p>
    </div>
    );
}
export default RoomCard;