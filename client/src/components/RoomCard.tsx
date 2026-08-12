type RoomCardProps={
    name:string;
    code:string;
    members:number;
};
function RoomCard({name,code,members}:RoomCardProps){
    return(
        <div className="room-card">
        <h2>{name}</h2>
        <p>Room code: {code}</p>
        <p>{members} members</p>
    </div>
    );
}
export default RoomCard;