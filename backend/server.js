import "dotenv/config";
import express from 'express';
import cors from 'cors';
import mongoose from "mongoose";
import argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { auth } from "./middleware/auth.js";

const app = express();
app.use(cors());

app.use(express.json());
const port = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGODB_URI);

//schemas
//[[
//
// base idea here: each user has a schema
// then each conversation has a schema. the conversation should receive the users account id and not adder id as toID and fromID
// each message has a sender which should have the senders account id and not adder id and the message is linked to a conversation by the convo id
//
//]]
//user schema

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    adderID: {
        type: String,
        required: true,
        unique: true,
    },
    accountID: {
        type: String,
        required: true,
        unique: true,
    },
    loggedIn: {
        type: Boolean,
        required: true,
        default: false,
    }
})

const User = mongoose.model("User", userSchema);

//conversation schema
const convoSchema = new mongoose.Schema({
    toID: {
        type: String,
        required: true,
    },
    fromID: {
        type: String,
        required: true,
    },
    convoID: {
        type: String,
        required: true,
        unique: true,
    }
})

const Conversation = mongoose.model("Conversation", convoSchema);

//message schema
const messageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
    convoID: {
        type: String,
        required: true,
    },
    reactions: [
        {
            emoji: {
                type: String,
                required: true,
            },
            users: [
                {
                    type: String,
                    required: true,
                }
            ]
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

const Message = mongoose.model("Message", messageSchema);

//#######################################
//User POST Requests (/createaccount, /signin, /deleteaccount, /modifyaccount)
//#######################################

app.post("/createaccount", async (req, res) => {
    //validate if all forms are filled out
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).send("some forms are not filled out")
    }

    //check if any user has the same email and if they do the account cannot be created
    const existingUser = await User.findOne({
        email: req.body.email
    });

    //send a status to the client if a user with that email already exists
    if (existingUser) {
        return res.status(400).send("user already exists")
    }

    //create the user as all validations have happened and now been successful
    const encryptedPassword = await argon2.hash(req.body.password);
    const adderID = crypto.randomInt(100000, 1000000).toString();
    const accountID = crypto.randomUUID();

    const user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: encryptedPassword,
        adderID: adderID,
        accountID: accountID,
        loggedIn: false
    })

    res.status(200).json({message: "success"})
})

app.post("/signin", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send("some forms are not filled out")
    }

    //find matching user
    const user = await User.findOne({email: req.body.email})

    if (user) {
        const passwordMatches = await argon2.verify(user.password, req.body.password);
        if (!passwordMatches) {
            return res.status(400).send("password must match")
        }
        //successful signin
        //set logged in to true and save it
        user.loggedIn = true;
        await user.save();

        //assign a jsonwebtoken
        const token = jwt.sign(
            {
                accountID: user.accountID,
                adderID: user.adderID,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        res.status(200).json({message: "success", token: token})
    }
})

app.post("/deleteaccount", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send("some forms are not filled out")
    }

    const user = await User.findOne({email: req.body.email})
    if (user) {
        const passwordMatches = await argon2.verify(user.password, req.body.password);
        if (!passwordMatches) {
            return res.status(400).send("password must match")
        }
        user.loggedIn = false;
        await user.save();

        await user.deleteOne({email: req.body.email})
    }
})

//#######################################
//Conversation POST Requests (/createconversation, /fetchconversations, /deleteconversation)
//#######################################

app.post("/createconversation", async (req, res) => {
    const fromID = req.body.fromID
    const toID = req.body.toID

    //identify the user based on the adderID
    const fromUser = await User.findOne({adderID: fromID});
    const toUser = await User.findOne({adderID: toID});
    const existingConversation = await Conversation.findOne({
        toID: toID,
        fromID: fromID
    })

    if (fromUser && toUser && !existingConversation) {
        //then create the conversation
        const convoID = crypto.randomUUID();

        const conversation = await Conversation.create({
            toID: toID,
            fromID: fromID,
            convoID: convoID,
        })
    }
})

//this should only run once and then the stuff should be cached
app.post("/fetchconversations", auth, async (req, res) => {
    const myID = req.user.adderID;

    const conversations = await Conversation.find({
        $or: [
            { fromID: myID },
            { toID: myID }
        ]
    });

    //target the fromID or toID different to the adderID sent by client to identify the user who is the other person
    const conversationsWithUsers = await Promise.all(
        conversations.map(async (conversation) => {
            const otherID =
                conversation.fromID === myID
                    ? conversation.toID
                    : conversation.fromID;

            const otherUser = await User.findOne({
                adderID: otherID
            });

            return {
                convoID: conversation.convoID,
                adderID: otherUser.adderID,
                username: otherUser.username
            };
        })
    );

    return res.status(200).json(conversationsWithUsers);
});

//#######################################
//Messages POST Requests (/sendmessage, /fetchmessages, /modifymessage)
//#######################################

app.post("/sendmessage", auth, async (req, res) => {
    const convoID = req.body.convoID;
    const messageText = req.body.message;
    const sender = req.user.accountID;

    const conversationExists = await Conversation.findOne({
        convoID: convoID
    });

    if (!conversationExists) {
        return res.status(400).send("conversation doesnt exist");
    }

    const message = new Message({
        message: messageText,
        sender: sender,
        convoID: convoID
    });

    await message.save();

    return res.status(201).json({
        message: "message sent"
    });
});

app.post("/fetchmessages", auth, async (req, res) => {
    const convoID = req.body.convoID;

    const messages = await Message.find({
        convoID: convoID
    });

    return res.status(200).json(messages);
});

app.post("/modifymessage", auth, async (req, res) => {
    const messageID = req.body.messageID;
    const modifyProperty = req.body.modifyProperty;
    const propertyArgument = req.body.propertyArgument;

    const message = await Message.findById(messageID);

    if (!message) {
        return res.status(404).send("message doesnt exist");
    }

    if (modifyProperty === "reaction") {
        if (!propertyArgument) {
            return res.status(400).send("reaction is required");
        }

        if (!message.reactions) {
            message.reactions = [];
        }

        const reaction = message.reactions.find(
            (reaction) => reaction.emoji === propertyArgument
        );

        if (!reaction) {
            message.reactions.push({
                emoji: propertyArgument,
                users: [req.user.accountID]
            });
        } else {
            const userIndex = reaction.users.indexOf(req.user.accountID);

            if (userIndex === -1) {
                reaction.users.push(req.user.accountID);
            } else {
                reaction.users.splice(userIndex, 1);
            }

            if (reaction.users.length === 0) {
                message.reactions = message.reactions.filter(
                    (reaction) => reaction.emoji !== propertyArgument
                );
            }
        }

        await message.save();

        return res.status(200).json({
            message: "reaction toggled"
        });
    }

    if (message.sender !== req.user.accountID) {
        return res.status(403).send("you cannot modify this message");
    }

    if (modifyProperty === "edit") {
        if (!propertyArgument || !propertyArgument.trim()) {
            return res.status(400).send("message is required");
        }

        message.message = propertyArgument;

        await message.save();

        return res.status(200).json({
            message: "message edited"
        });
    }

    if (modifyProperty === "delete") {
        await Message.findByIdAndDelete(messageID);

        return res.status(200).json({
            message: "message deleted"
        });
    }

    return res.status(400).send("invalid modification");
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})