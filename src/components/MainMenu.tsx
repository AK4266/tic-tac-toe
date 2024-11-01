import React, { useEffect } from "react";
import Nakama from "../Nakama";
import { useNavigate } from "react-router-dom";

const MainMenu: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        Nakama.authenticate();
    }, []);

    const handleStart = async () => {
        await Nakama.authenticate();
        await Nakama.findMatch(() => {
            console.log("Both players joined. Navigating to Game screen...");
            navigate("/in-game"); // Navigate to the actual game screen
        });
        console.log("Navigating to Matchmaking screen...");
        navigate("/matchmaking");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-500">
            <h1 className="text-2xl text-white">Welcome to</h1>
            <h2 className="text-5xl text-yellow-400">XOXO</h2>
            <button
                className="mt-12 bg-yellow-400 text-white px-6 py-2 rounded-lg"
                onClick={handleStart}
            >
                Begin
            </button>
        </div>
    );
};

export default MainMenu;
