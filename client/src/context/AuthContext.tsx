import {createContext,useState,useEffect, type ReactNode,type Dispatch,type SetStateAction,} from "react";
type User={
    id:number;
    username:string;
    email:string;
}
type AuthContextType={
    accessToken:String;
    setAccessToken:React.Dispatch<React.SetStateAction<string>>;
    isInitializing:boolean;
    user:User|null;
    setUser:Dispatch<SetStateAction<User|null>>;
    login:(email:string,password:string)=>Promise<void>;
};
export const AuthContext=createContext<AuthContextType>({
    accessToken:"",
    setAccessToken: () => {},
    isInitializing:false,
    user:null,
    setUser: () => {},
    login:async ()=>{},
});
type AuthProviderProps={
    children:ReactNode;
}
export function AuthProvider({children}:AuthProviderProps){
    const [accessToken,setAccessToken]=useState("");
    const [isInitializing,setIsInitializing]=useState(true);
    const [user,setUser]=useState<User | null>(null);
    useEffect(()=>{
        async function refreshAccessToken(){
            try{
                const response=await fetch(
                    "http://localhost:5000/api/auth/refresh",
                    {
                        method:"POST",
                        credentials:"include",
                    }
                );
                const data =await response.json();
                if(!response.ok){
                    return;
                }
                setAccessToken(data.accessToken);
            }catch(error){
                console.error("Refresh request failed:",error);
            }finally{
                setIsInitializing(false);
            }
        }
        refreshAccessToken();
    },[])
    async function login(email:string,password:string) {
        const response=await fetch("http://localhost:5000/api/auth/login",{
            method:"POST",
            credentials:"include",
            headers:{
                "Content-type":"application/json",
            },
            body:JSON.stringify({
                email,
                password,
            }),
        });
        const data=await response.json();
        if(!response.ok){
            throw new Error(data.error || "Login failed");
        }
        setAccessToken(data.accessToken);
        setUser(data.user);    
    }
    return (
        <AuthContext.Provider value={{accessToken,setAccessToken,isInitializing,user,setUser,login,}}>
            {children}
        </AuthContext.Provider>
    )
}