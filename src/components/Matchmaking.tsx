import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nakama from "../Nakama";

const Matchmaking: React.FC = () => {
    const navigate = useNavigate();
    const [matchResult, setMatchResult] = useState<any>(null); // State to store the match result

    const initiateMatchmaking = async () => {
        await Nakama.authenticate();

        // Handle match presence updates
        Nakama.socket.onmatchpresence = (event: any) => {
            console.log("Presence update:", event);

            // Check if two players are in the match
            if (event.joins.length >= 2) {
                console.log("Both players joined. Navigating to Game screen...");
                navigate('/in-game');
            }
        };

        // Start matchmaking process
        const result = await Nakama.client.listMatches(Nakama.session);
        console.log(result);

        // Update state to trigger useEffect re-run when result changes
        setMatchResult(result);

        // Join the match if available or start a new one
        if (result.matches && result.matches.length > 0) {
            const firstMatch = result.matches[0];

            // Check match size and navigate accordingly
            if (firstMatch.size === 1) {
                await Nakama.socket.joinMatch(firstMatch.match_id);
                console.log("Joined existing match.");
            } else if (firstMatch.size === 2) {
                console.log("Match full, navigating to in-game.");
                navigate('/in-game');
            }
        } else {
            console.error("No matches available. Waiting for a player...");
        }
    };

    useEffect(() => {
        initiateMatchmaking();
    }, [matchResult]); // Trigger initiateMatchmaking again when matchResult changes

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-500">
            <p className="text-2xl text-white">Searching for an opponent...</p>
            <div className="spinner border-4 border-yellow-400 rounded-full w-16 h-16 mt-4 animate-spin"></div>
        </div>
    );
};

export default Matchmaking;
