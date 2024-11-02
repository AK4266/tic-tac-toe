import { useEffect, useState } from "react";
import Square from "./Square";
import '../App.css';
import Nakama from "../Nakama";

const OpCodes = {
    MOVE: 1
};

function Board() {
    const [board, setBoard] = useState(["", "", "", "", "", "", "", "", ""]);
    const [player, setPlayer] = useState(""); // Assigned as "X" or "O"
    const [turn, setTurn] = useState("X");

    useEffect(() => {
        // Assign player as "X" or "O" based on who joins first (for demo purposes)
        if (!localStorage.getItem("playerRole")) {
            const isPlayerX = Math.random() < 0.5;
            localStorage.setItem("playerRole", isPlayerX ? "X" : "O");
        }
        setPlayer(localStorage.getItem("playerRole") || "");

        // Handler for incoming match data
        const handleMatchData = (matchState: any) => {
            if (matchState.opCode === OpCodes.MOVE) {
                const { square, player: movePlayer } = JSON.parse(matchState.state);

                console.log(`Received move from player ${movePlayer} at square ${square}`);

                // Update board with received move
                setBoard((prevBoard) =>
                    prevBoard.map((val, idx) =>
                        idx === square && val === "" ? movePlayer : val
                    )
                );

                // Update turn based on the last move
                setTurn(movePlayer === "X" ? "O" : "X");
            }
        };

        // Listen for match data from Nakama server
        Nakama.socket.onmatchdata = handleMatchData;

        // Clean up socket listener
        return () => {
            Nakama.socket.onmatchdata = null;
        };
    }, []);

    const chooseSquare = async (square: any) => {
        if (turn === player && board[square] === "") {
            console.log(`Player ${player} is making a move at square ${square}`);
            const res = await Nakama.client.rpc(Nakama.session, "tic-tac-toe_js", {})

            console.log(res)


            // Update the board locally
            setBoard((prevBoard) =>
                prevBoard.map((val, idx) =>
                    idx === square ? player : val
                )
            );

            // Prepare data to send to the server
            const matchData = { square, player };
            await Nakama.socket.sendMatchState(
                localStorage.getItem("match_id"),
                OpCodes.MOVE,
                JSON.stringify(matchData)
            );

            // Toggle turn locally
            setTurn(player === "X" ? "O" : "X");
        } else {
            console.log(`It's not ${player}'s turn or the square is already marked.`);
        }
    };

    return (
        <div className="board">
            <div className="row">
                <Square val={board[0]} chooseSquare={() => chooseSquare(0)} />
                <Square val={board[1]} chooseSquare={() => chooseSquare(1)} />
                <Square val={board[2]} chooseSquare={() => chooseSquare(2)} />
            </div>
            <div className="row">
                <Square val={board[3]} chooseSquare={() => chooseSquare(3)} />
                <Square val={board[4]} chooseSquare={() => chooseSquare(4)} />
                <Square val={board[5]} chooseSquare={() => chooseSquare(5)} />
            </div>
            <div className="row">
                <Square val={board[6]} chooseSquare={() => chooseSquare(6)} />
                <Square val={board[7]} chooseSquare={() => chooseSquare(7)} />
                <Square val={board[8]} chooseSquare={() => chooseSquare(8)} />
            </div>
            <div className="status">
                <p>Current Turn: {turn}</p>
                <p>Your Role: {player}</p>
            </div>
        </div>
    );
}

export default Board;
