import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nakama from "../Nakama";

const Matchmaking: React.FC = () => {
    const navigate = useNavigate();
    const [playerIds, setPlayerIds] = useState<string[]>([]); // Local state for player IDs

    const initiateMatchmaking = async () => {
        await Nakama.authenticate();

        // Start listening for player presence updates
        Nakama.startListeningForPlayerPresence(() => {
            console.log("Both players are ready. Navigating to Game screen...");
            navigate('/in-game');
        });

        // Start matchmaking process
        const result = await Nakama.client.listMatches(Nakama.session);
        console.log(result);

        if (result.matches && result.matches.length > 0) {
            const firstMatch = result.matches[0];

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

    // Effect to navigate when there are two players
    useEffect(() => {
        if (playerIds.length === 2) {
            console.log("Navigating to in-game...");
            navigate('/in-game');
        }
    }, [playerIds, navigate]);

    // Listen for player IDs changes from Nakama
    useEffect(() => {
        const updatePlayerIds = () => {
            setPlayerIds(Nakama.playerIds);
        };

        // Update player IDs on socket presence update
        Nakama.socket.onmatchpresence = (event: any) => {
            event.joins.forEach((join: any) => {
                if (!playerIds.includes(join.user_id)) {
                    setPlayerIds((prevIds) => [...prevIds, join.user_id]);
                }
            });
        };

        // Call the matchmaking function
        initiateMatchmaking();

        // Cleanup listener on unmount
        return () => {
            Nakama.socket.onmatchpresence = null; // Remove the event listener
        };
    }, [playerIds]); // Add playerIds as a dependency to ensure it updates correctly

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-500">
            <p className="text-2xl text-white">Searching for an opponent...</p>
            <div className="spinner border-4 border-yellow-400 rounded-full w-16 h-16 mt-4 animate-spin"></div>
        </div>
    );
};

export default Matchmaking;
