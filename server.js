
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "*" }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(bodyParser.json());

// Endpoint to send a WhatsApp message
app.post("/send-message", async (req, res) => {
    const { to, message } = req.body;
    try {
        console.log("to msg =>", to, message)
        const msg = await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${to}`
        });
        res.json({ success: true, message: "Message sent!", msg });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to receive incoming WhatsApp messages from Twilio
app.post("/receive-message", (req, res) => {
    const { From, Body, MediaUrl0, MessageType } = req.body;
    console.log(`Received a message from ${From}: ${Body}`);

    // Emit message to all connected clients (admin frontend)
    // io.emit("newMessage", { from: From, body: Body, mediaUrl: MediaUrl0, messageType: MessageType });
    io.emit("newMessage", { from: "From"});
    res.sendStatus(200);
});

io.on("connection", (socket) => {
    console.log("Client connected");

    // Test emit to verify client receives data
    socket.emit("testEvent", { message: "Test data from server" });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
