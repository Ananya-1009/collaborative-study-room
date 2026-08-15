type RoomCardProps={
    name:string;
    topic: string;
    code: string;
};
function RoomCard({name,code,topic}:RoomCardProps){
    return(
        <div className="room-card">
        <h2>{name}</h2>
        <p>Room code: {code}</p>
        <p>Topic:{topic} members</p>
    </div>
    );
}
export default RoomCard;