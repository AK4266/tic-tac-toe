import { Client, RpcResponse } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

interface FindMatchResponse extends RpcResponse {
    payload: {
        matchIds: string[];
    };
}

class Nakama {
    client: Client;
    session: any;
    socket: any;
    matchID: string | null = null;
    onMatchReady: (() => void) | null = null;

    constructor() {
        const useSSL = false;
        this.client = new Client("defaultkey", "localhost", "7350", useSSL);
    }

    async authenticate() {
        let deviceId = localStorage.getItem("deviceId") || uuidv4();
        localStorage.setItem("deviceId", deviceId);

        this.session = await this.client.authenticateDevice(deviceId, true);
        localStorage.setItem("user_id", this.session.user_id);

        const trace = false;
        this.socket = this.client.createSocket(false, trace);

        // Return the socket connection promise to ensure it's complete before proceeding
        await this.socket.connect(this.session);
        console.log("Socket connected");

        // // Listen for presence updates in the match to check when players are ready
        // this.socket.onmatchpresence = (event: { joins: string | any[]; }) => {
        //     console.log("Presence update:", event);
        //     const playersJoined = event.joins.length > 1; // Check if at least two players joined
        //     if (playersJoined && this.onMatchReady) {
        //         this.onMatchReady(); // Trigger the callback to start the match
        //     }
        // };
        this.socket.onmatchpresence = (event: any) => {
            console.log("Match presence event:", event);
            // Log user_id for each presence to verify both are recognized
            event.joins.forEach((join: any) => console.log("Joined user:", join.user_id));
            if (event.joins.length >= 2 && this.onMatchReady) {
                this.onMatchReady(); // Only navigate when two players are confirmed
            }
        };

        this.socket.onmatchdata = (data: any) => {
            console.log("Received match data:", data);
            // Process data while ensuring each move correctly updates the state
        };

    }

    async findMatch(onMatchReadyCallback: () => void) {
        this.onMatchReady = onMatchReadyCallback; // Set the callback to handle navigation
        const rpcid = "find_match_js";
        const matches = await this.client.rpc(this.session, rpcid, {}) as FindMatchResponse;

        console.log(matches);

        if (matches.payload && Array.isArray(matches.payload.matchIds) && matches.payload.matchIds.length > 0) {
            this.matchID = matches.payload.matchIds[0];
            await this.socket.joinMatch(this.matchID);
            // var status = {
            //     "Status": "Playing a match",
            //     "MatchId": this.matchID
            // };
            // await this.socket.updateStatus(JSON.stringify(status));
            console.log("Match joined!");
        } else {
            console.error("No match IDs found in the response.");
        }
    }

    async makeMove(index: number) {
        // if (this.matchID && this.socket && this.socket.isConnected) {
        //     const data = { position: index };
        //     await this.socket.sendMatchState(this.matchID, 4, data);
        //     console.log("Match data sent");
        // } else {
        //     console.error("Cannot make move, matchID is null or socket is disconnected.");
        // }
        var data = { "position": index };
        await this.socket.sendMatchState(this.matchID, 4, JSON.stringify(data));
        console.log("Match data sent")
    }
}

export default new Nakama();
