import {useState} from "react";
import Authentication from "./pages/Authentication.tsx";
import {Icon} from "@iconify/react";
import Conversations from "./tabs/Conversations.tsx";

export default function App() {

    const [signedIn, setSignedIn] = useState(
        !!localStorage.getItem("token")
    );

    if (!signedIn) {
        return <Authentication setSignedIn={setSignedIn} />
    }

    const [mode, setMode] = useState<string>("friends") //set to friends on default

    return (
        <div className="w-full h-screen flex flex-row">
            <div className="w-fit h-full flex flex-col p-2.5 gap-5 bg-[#1C1C1C] border-r border-[#2C2C2C]">
                <div className="w-fit h-fit  flex flex-col p-2 justify-center items-center">
                    <Icon icon={"famicons:chatbubble-sharp"} width={28} height={28} color={"4C8ACC"} />
                </div>
                <hr className="text-white/15" />
                <div className="w-fit h-fit flex flex-col gap-3">
                    <div onClick={() => {setMode("friends")}} className={`w-fit h-fit flex flex-col p-2 rounded-md justify-center items-center ${mode === "friends" ? "bg-[#323232]" : "bg-transparent"} ${mode === "friends" ? "border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/10" : null}`}>
                        <Icon icon={"fa7-solid:user-friends"} width={28} height={28} color={mode === "friends" ? "#FFFFFF" : "#A7A7A7"} />
                    </div>
                    <div onClick={() => {setMode("settings")}} className={`w-fit h-fit flex flex-col p-2 rounded-md justify-center items-center ${mode === "settings" ? "bg-[#323232]" : "bg-transparent"} ${mode === "settings" ? "border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/10" : null}`}>
                        <Icon icon={"famicons:cog-sharp"} width={28} height={28} color={mode === "settings" ? "#FFFFFF" : "#A7A7A7"} />
                    </div>
                </div>
            </div>
            {
                mode === "friends" ? <Conversations /> : null
            }
        </div>
    )
}