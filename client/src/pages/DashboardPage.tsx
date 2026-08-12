import RoomCard from "../components/RoomCard";
function DashboardPage(){
    return(
        <div>
            <RoomCard
                name="DSA Practice"
                code="DSA123"
                members={4}
            />
            <RoomCard
                name="DBMS Revision"
                code="DBMS42"
                members={7}
            />
        </div>
    );
}

export default DashboardPage;