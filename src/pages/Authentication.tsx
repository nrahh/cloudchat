import {useState} from "react";

// @ts-ignore
export default function Authentication({setSignedIn}) {

    async function signup() {

        const username = (document.getElementById("username") as HTMLInputElement)?.value;
        const email = (document.getElementById("email") as HTMLInputElement)?.value;
        const password = (document.getElementById("password") as HTMLInputElement)?.value;

        // @ts-ignore
        const response = await fetch("http://localhost:3000/createaccount", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
    }

    async function signin() {

        const email = (document.getElementById("email") as HTMLInputElement)?.value;
        const password = (document.getElementById("password") as HTMLInputElement)?.value;

        const response = await fetch("http://localhost:3000/signin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            setSignedIn(true);
        }
    }

    const [signupMode, setSignupMode] = useState<boolean>(true);

    return (
        <div className="w-full h-screen flex flex-col justify-center items-center">
            <div className="flex flex-col h-fit p-5 rounded-lg gap-4.5 bg-[#1A1A1A] border border-white/10 drop-shadow-xl">
                <div className="w-fit h-fit flex flex-col gap-1">
                    <h2 className="hostgroteskmedium text-left text-white text-xl">{signupMode ? "Signup" : "Signin"}</h2>
                    <h5 className="text-left text-white/30">Please enter following credentials.</h5>
                </div>
                {/*username*/}
                {
                    signupMode ? (<div className="w-full h-fit flex flex-col gap-2">
                        <h3 className="text-left text-white/80 text-md">Username</h3>
                        <input id="username" type="text" className="outline-none w-full bg-[#252525] p-2 rounded-md text-white border-t border-r-[0.5px] border-l-[0.5px] border-b-0 border-white/5" />
                    </div>) : null
                }

                {/*email*/}
                <div className="w-full h-fit flex flex-col gap-2">
                    <h3 className="text-left text-white/80 text-md">Email</h3>
                    <input id="email" type="email" className="outline-none w-full bg-[#252525] p-2 rounded-md text-white border-t border-r-[0.5px] border-l-[0.5px] border-b-0 border-white/5" />
                </div>

                {/*password*/}
                <div className="w-full h-fit flex flex-col gap-2">
                    <h3 className="text-left text-white/80 text-md">Password</h3>
                    <input id="password" type="password" className="outline-none w-full bg-[#252525] p-2 rounded-md text-white border-t border-r-[0.5px] border-l-[0.5px] border-b-0 border-white/5" />
                </div>

                {signupMode ? (
                    <button onClick={signup} className="bg-[#3E6EA1] text-white font-medium p-2 rounded-md border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/5">
                        Signup
                    </button>
                ) : (
                    <button onClick={signin} className="bg-[#3E6EA1] text-white font-medium p-2 rounded-md border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/5">
                        Signin
                    </button>
                )}

                {/*signup / signin mode*/}
                {
                    signupMode ? (
                        <button className="text-white/50 text-sm p-2 cursor-pointer" onClick={() => {setSignupMode(false)}}>
                            Click here to signin
                        </button>
                    ) : (
                        <button className="text-white/50 text-sm p-2 cursor-pointer" onClick={() => {setSignupMode(true)}}>
                            Click here to signup
                        </button>
                    )
                }
            </div>
        </div>
    )
}