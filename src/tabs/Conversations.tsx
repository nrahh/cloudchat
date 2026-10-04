import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

type Conversation = {
    convoID: string;
    adderID: string;
    username: string;
};

type Reaction = {
    emoji: string;
    users: string[];
};

type Message = {
    _id: string;
    message: string;
    sender: string;
    convoID: string;
    reactions?: Reaction[];
    createdAt: string;
};

export default function Conversations() {
    const [addingConvo, setAddingConvo] = useState<boolean>(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConvo, setCurrentConvo] = useState<Conversation | null>(null);
    const [toID, setToID] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState<string>("");
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [myAccountID, setMyAccountID] = useState<string>("");

    async function fetchConversations() {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        const response = await fetch("https://cloudchat-8rs3.onrender.com/fetchconversations", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setConversations(data);
    }

    useEffect(() => {
        fetchConversations();

        const token = localStorage.getItem("token");

        if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setMyAccountID(payload.accountID);
        }
    }, []);

    async function createConversation() {
        const token = localStorage.getItem("token");

        if (!token || !toID) {
            return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const fromID = payload.adderID;

        const response = await fetch("https://cloudchat-8rs3.onrender.com/createconversation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                fromID,
                toID
            })
        });

        if (!response.ok) {
            return;
        }

        setToID("");
        setAddingConvo(false);

        await fetchConversations();
    }

    async function modifyMessage(
        messageID: string,
        modifyProperty: string,
        propertyArgument?: string
    ) {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        const response = await fetch("https://cloudchat-8rs3.onrender.com/modifymessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                messageID,
                modifyProperty,
                propertyArgument
            })
        });

        if (!response.ok) {
            return;
        }

        setOpenMenu(null);

        if (currentConvo) {
            await fetchMessages(currentConvo.convoID);
        }
    }

    async function fetchMessages(convoID: string) {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        const response = await fetch("https://cloudchat-8rs3.onrender.com/fetchmessages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                convoID
            })
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setMessages(data);
    }

    async function selectConversation(conversation: Conversation) {
        setCurrentConvo(conversation);
        setMessages([]);
        setOpenMenu(null);

        await fetchMessages(conversation.convoID);
    }

    async function sendMessage() {
        const token = localStorage.getItem("token");

        if (!token || !currentConvo || !messageText.trim()) {
            return;
        }

        const response = await fetch("https://cloudchat-8rs3.onrender.com/sendmessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                convoID: currentConvo.convoID,
                message: messageText
            })
        });

        if (!response.ok) {
            return;
        }

        setMessageText("");

        await fetchMessages(currentConvo.convoID);
    }

    return (
        <div className="w-full h-full flex flex-row">
            <div className="w-fit h-full flex flex-col gap-3 p-4 bg-[#1C1C1C] border-r border-[#2C2C2C]">
                <div className="w-full flex flex-row gap-5 justify-between items-center">
                    <h2 className="text-white text-lg font-medium text-left">
                        Conversations
                    </h2>

                    <button
                        onClick={() => {
                            setAddingConvo(!addingConvo);
                        }}
                        className="w-fit h-fit flex flex-col items-center justify-center"
                    >
                        <Icon
                            icon="akar-icons:chat-add"
                            width={17}
                            height={17}
                            color="white"
                        />
                    </button>
                </div>

                {addingConvo && (
                    <div className="gap-3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit h-fit flex flex-col absolute p-3 bg-white/10 backdrop-blur-2xl rounded-lg border border-white/15">
                        <div className="flex flex-row justify-between items-center gap-3 w-full">
                            <h2 className="text-white text-left">
                                Add User
                            </h2>

                            <button
                                onClick={() => {
                                    setAddingConvo(false);
                                }}
                                className="w-fit h-fit flex flex-col items-center justify-center"
                            >
                                <Icon
                                    icon="ant-design:close-outlined"
                                    width={15}
                                    height={15}
                                    color="white"
                                />
                            </button>
                        </div>

                        <hr className="text-white/10" />

                        <input
                            type="number"
                            value={toID}
                            onChange={(event) => setToID(event.target.value)}
                            placeholder="Adder ID"
                            className="w-full h-fit p-1.5 text-white bg-white/10 rounded-md outline-none"
                        />

                        <button
                            onClick={createConversation}
                            className="p-2 text-white bg-[#3E6EA1] border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/10 rounded-md cursor-pointer"
                        >
                            Create Conversation
                        </button>
                    </div>
                )}

                <hr className="text-white/15" />

                {conversations.map((conversation) => (
                    <button
                        key={conversation.convoID}
                        onClick={() => selectConversation(conversation)}
                        className={`w-full h-fit flex flex-col p-1.5 cursor-pointer rounded-md border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/10 ${
                            currentConvo?.convoID === conversation.convoID
                                ? "bg-white/10"
                                : "bg-white/5"
                        }`}
                    >
                        <h2 className="text-left text-white">
                            {conversation.username}
                        </h2>

                        <span className="text-left text-white/30 text-xs">
                            {conversation.adderID}
                        </span>
                    </button>
                ))}
            </div>

            <div className="w-full h-full flex flex-col">
                {currentConvo && (
                    <div className="w-full h-full flex flex-col">
                        <div className="bg-[#1C1C1C] border-b border-[#2C2C2C] p-3 flex flex-col w-full h-fit">
                            <h2 className="text-white">
                                {currentConvo.username}
                            </h2>

                            <span className="text-white/30 text-xs">
                                {currentConvo.adderID}
                            </span>
                        </div>

                        <div className="w-full h-full flex flex-col p-3 gap-2 overflow-y-auto">
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`w-full h-fit flex flex-col ${
                                        message.sender === myAccountID
                                            ? "items-end"
                                            : "items-start"
                                    }`}
                                >
                                    <div className="relative group w-fit">
                                        <div
                                            className={`w-fit h-fit flex flex-row justify-between items-center gap-1 p-2 rounded-lg ${
                                                message.sender === myAccountID
                                                    ? "bg-[#3E6EA1]"
                                                    : "bg-[#1C1C1C] border border-white/10"
                                            }`}
                                        >
                                            <h2 className="text-white">
                                                {message.message}
                                            </h2>

                                            {message.sender === myAccountID && (
                                                <div className="relative">
                                                    <Icon
                                                        icon="akar-icons:more-vertical"
                                                        width={15}
                                                        height={15}
                                                        color="white"
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setOpenMenu(
                                                                openMenu ===
                                                                message._id
                                                                    ? null
                                                                    : message._id
                                                            );
                                                        }}
                                                    />

                                                    <div
                                                        className={`w-fit h-fit flex flex-col gap-3 p-2 bg-white/15 backdrop-blur-2xl rounded-lg border border-white/15 absolute z-50 right-0 ${
                                                            openMenu ===
                                                            message._id
                                                                ? "flex"
                                                                : "hidden group-hover:flex"
                                                        }`}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                modifyMessage(
                                                                    message._id,
                                                                    "reaction",
                                                                    "❤️"
                                                                )
                                                            }
                                                            className="w-fit h-fit pb-2 border-b border-b-white/15"
                                                        >
                                                            ❤️
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                modifyMessage(
                                                                    message._id,
                                                                    "reaction",
                                                                    "👍️"
                                                                )
                                                            }
                                                            className="w-fit h-fit pb-2 border-b border-b-white/15"
                                                        >
                                                            👍️
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                modifyMessage(
                                                                    message._id,
                                                                    "reaction",
                                                                    "😭"
                                                                )
                                                            }
                                                            className="w-fit h-fit pb-2 border-b border-b-white/15"
                                                        >
                                                            😭
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                modifyMessage(
                                                                    message._id,
                                                                    "reaction",
                                                                    "😂"
                                                                )
                                                            }
                                                            className="w-fit h-fit pb-2 border-b border-b-white/15"
                                                        >
                                                            😂
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const newMessage =
                                                                    prompt(
                                                                        "Edit message",
                                                                        message.message
                                                                    );

                                                                if (
                                                                    newMessage !==
                                                                    null &&
                                                                    newMessage.trim()
                                                                ) {
                                                                    modifyMessage(
                                                                        message._id,
                                                                        "edit",
                                                                        newMessage
                                                                    );
                                                                }
                                                            }}
                                                            className="w-fit h-fit flex flex-col items-center justify-center pb-2 border-b border-b-white/15"
                                                        >
                                                            <Icon
                                                                icon="ant-design:edit-outlined"
                                                                width={25}
                                                                height={25}
                                                                color="white"
                                                            />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                if (
                                                                    confirm(
                                                                        "Delete this message?"
                                                                    )
                                                                ) {
                                                                    modifyMessage(
                                                                        message._id,
                                                                        "delete"
                                                                    );
                                                                }
                                                            }}
                                                            className="w-fit h-fit flex flex-col items-center justify-center"
                                                        >
                                                            <Icon
                                                                icon="ant-design:delete-outlined"
                                                                width={25}
                                                                height={25}
                                                                color="white"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {message.reactions &&
                                            message.reactions.length > 0 && (
                                                <div className="w-fit h-fit flex flex-row gap-1.5 mt-1 bg-transparent">
                                                    {message.reactions.map(
                                                        (reaction) => (
                                                            <button
                                                                key={
                                                                    reaction.emoji
                                                                }
                                                                onClick={() =>
                                                                    modifyMessage(
                                                                        message._id,
                                                                        "reaction",
                                                                        reaction.emoji
                                                                    )
                                                                }
                                                                className="w-fit h-fit flex flex-row items-center gap-1 px-1.5 py-0.5 bg-white/10 border border-white/10 rounded-full cursor-pointer"
                                                            >
                                                                <span>
                                                                    {
                                                                        reaction.emoji
                                                                    }
                                                                </span>

                                                                <span className="text-white/70 text-xs">
                                                                    {
                                                                        reaction
                                                                            .users
                                                                            .length
                                                                    }
                                                                </span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="w-full h-fit flex flex-row items-center justify-between p-3 bg-[#1C1C1C] border-t border-[#2C2C2C]">
                            <input
                                type="text"
                                value={messageText}
                                onChange={(event) =>
                                    setMessageText(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        sendMessage();
                                    }
                                }}
                                className="w-full h-fit text-white outline-none bg-transparent"
                                placeholder="message"
                            />

                            <button
                                onClick={sendMessage}
                                className="w-fit h-fit flex flex-col items-center justify-center p-2 cursor-pointer rounded-md bg-[#3E6EA1] border-t border-l-[0.5px] border-r-[0.5px] border-b-0 border-white/10"
                            >
                                <Icon
                                    icon="boxicons:send"
                                    width={20}
                                    height={20}
                                    color="white"
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}