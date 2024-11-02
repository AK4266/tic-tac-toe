// import React, { useEffect, useState } from "react";
// import Nakama from "../Nakama";

// const InGame: React.FC = () => {
//     const [board, setBoard] = useState<number[]>(Array(9).fill(0));
//     const [playerTurn, setPlayerTurn] = useState(true);
//     const [headerText, setHeaderText] = useState("Your turn!");

//     const handleCellClick = async (index: number) => {
//         await Nakama.makeMove(index);
//     };

//     useEffect(() => {
//         // Authenticate and set up socket connection
//         const setupNakama = async () => {
//             await Nakama.authenticate();  // Waits for socket connection

//             // Ensure socket connection before setting onmatchdata
//             if (Nakama.socket && Nakama.socket.isConnected) {
//                 Nakama.socket.onmatchdata = (result: any) => {
//                     switch (result.opCode) {
//                         case 1:
//                             setPlayerTurn(result.data.marks[localStorage.getItem("user_id") || ""] === 1);
//                             break;
//                         case 2:
//                             setBoard(result.data.board);
//                             setPlayerTurn(!playerTurn);
//                             setHeaderText(playerTurn ? "Opponent's turn!" : "Your turn!");
//                             break;
//                         case 3:
//                             setHeaderText(result.data.winner === playerTurn ? "Winner!" : "You lose :(");
//                             break;
//                         default:
//                             break;
//                     }
//                 };
//             } else {
//                 console.error("Socket is not connected after authentication.");
//             }
//         };

//         setupNakama();
//     }, [playerTurn]);

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800">
//             <h1 className="text-xl text-white">{headerText}</h1>
//             <div className="grid grid-cols-3 gap-1 mt-4">
//                 {board.map((cell, index) => (
//                     <button
//                         key={index}
//                         className="w-24 h-24 text-3xl text-white bg-gray-700"
//                         onClick={() => handleCellClick(index)}
//                     >
//                         {cell === 1 ? "O" : cell === 2 ? "X" : ""}
//                     </button>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default InGame;

import React, { useEffect, useState, useCallback } from 'react';
import CONFIG from '../config';
import Nakama from '../Nakama';
import { useNavigate } from 'react-router-dom';

const InGame: React.FC = () => {
    const [board, setBoard] = useState<number[]>(Array(9).fill(0));
    const [headerText, setHeaderText] = useState<string>("Waiting for game to start");
    const [playerTurn, setPlayerTurn] = useState<boolean>(false);
    const [playerPos, setPlayerPos] = useState<number | null>(null);
    const [showPlayAIBtn, setShowPlayAIBtn] = useState<boolean>(false);
    const navigate = useNavigate()
    console.log(Nakama.session);

    const nakamaListener = useCallback(() => {
        if (!Nakama.socket) {
            console.error("Nakama socket is not initialized.");
            return;
        }

        Nakama.socket.onmatchdata = (result: any) => {
            const json = JSON.parse(new TextDecoder().decode(result.data));

            switch (result.op_code) {
                case 1:
                    handleGameData(json);
                    break;
                case 2:
                    updateBoard(json.board);
                    togglePlayerTurn();
                    break;
                case 3:
                    endGame(json);
                    break;
                case 6:
                    setHeaderText("Opponent has left");
                    setShowPlayAIBtn(true);
                    break;
            }
        };
    }, []);

    const authenticateAndSetupListener = async () => {
        await Nakama.authenticate();
        nakamaListener();
    };

    useEffect(() => {
        authenticateAndSetupListener();
    }, []);

    const handleGameData = (data: any) => {
        const userId = localStorage.getItem("user_id") || "";
        console.log("user_id", userId)
        if (data.marks[userId] === 1) {
            setPlayerTurn(true);
            setPlayerPos(1);
            setHeaderText("Your turn!");
        } else {
            setPlayerPos(2);
            setHeaderText("Opponent's turn!");
        }
    };

    const updateBoard = (newBoard: number[]) => {
        setBoard([...newBoard]);
    };

    const togglePlayerTurn = () => {
        setPlayerTurn(prevTurn => !prevTurn);
        setHeaderText(prevTurn => (prevTurn ? "Opponent's turn!" : "Your turn!"));
    };

    const makeMove = async (index: number) => {
        await Nakama.makeMove(index);
    };

    const endGame = (data: any) => {
        updateBoard(data.board);
        if (data.winner === playerPos) {
            setHeaderText("Winner!");
        } else if (data.winner === undefined) {
            setHeaderText("Tie!");
        } else {
            setHeaderText("You lose :(");
        }
    };

    const handleLeave = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("device_id");
        Nakama.playerIds = []
        navigate("/")
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-500">
            <h1 className="text-3xl font-bold text-white mb-8">{headerText}</h1>
            <div className="grid grid-cols-3 gap-1 w-60 h-60">
                {board.map((cell, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-center w-20 h-20 bg-yellow-400 border-2 border-white"
                        onClick={() => makeMove(index)}
                    >

                        {cell === 1 && <img src="/assets/X.png" alt="X" />}
                        {cell === 2 && <img src="/assets/O.png" alt="O" />}
                    </div>
                ))}
            </div>
            {
                <button
                    className="mt-8 bg-yellow-400 text-xl text-blue-500 py-2 px-8 rounded hover:scale-105 transition-transform"
                    onClick={handleLeave}
                >
                    Leave
                </button>
            }
        </div>
    );
};

export default InGame;
