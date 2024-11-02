'use client';
import { useState, useEffect, useRef } from 'react';
import Square from './Square';
import { MatchData } from '@heroiclabs/nakama-js';
import Nakama from '../Nakama';
import {
    OpCode,
    StartMessage,
    DoneMessage,
    UpdateMessage,
} from '../message';

export default function Game() {
    const [squares, setSquares] = useState<(number | null)[]>(Array(9).fill(null));
    const [playerIndex, setPlayerIndex] = useState<number>(-1);
    const [playerTurn, setPlayerTurn] = useState<number>(-1);
    const [deadline, setDeadline] = useState<number | null>(null);
    const [gameMessage, setMessage] = useState<string>('Welcome to TicTacToe');
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const nakamaRef = useRef<Nakama | undefined>(undefined);

    function initSocket() {
        if (!nakamaRef.current || !nakamaRef.current.socket || !nakamaRef.current.session) return;
        const userId = nakamaRef.current.session.user_id;

        let socket = nakamaRef.current.socket;
        console.log(nakamaRef);

        socket.onmatchdata = (matchState: MatchData) => {
            if (!nakamaRef.current) return;
            const json_string = new TextDecoder().decode(matchState.data);
            console.log("json", json_string)
            const json: string = json_string ? JSON.parse(json_string) : '';
            console.log('op_code: ', matchState.op_code);
            console.log(matchState);

            let myPlayerIndex = nakamaRef.current.gameState.playerIndex;

            if (typeof json === 'object' && json !== null) {
                switch (matchState.op_code) {
                    case OpCode.START:
                        const startMessage = json as StartMessage;
                        setTimeLeft(0);
                        setSquares(startMessage.board);
                        setPlayerTurn(startMessage.mark);
                        setGameStarted(true);
                        setMessage('Game Started!');
                        console.log("startMessage", startMessage);

                        let tmpId = startMessage.marks[userId!];
                        if (tmpId !== null) {
                            setPlayerIndex(tmpId);
                            nakamaRef.current.gameState.playerIndex = tmpId;
                        } else {
                            console.error('tmpId is null');
                        }
                        break;
                    case OpCode.UPDATE:
                        const updateMessage = json as UpdateMessage;
                        if (updateMessage.mark === myPlayerIndex) {
                            setMessage('Your Turn!');
                        }
                        console.log("updateMessage", updateMessage)
                        setPlayerTurn(updateMessage.mark);
                        setSquares(updateMessage.board);
                        setDeadline(updateMessage.deadline);
                        break;
                    case OpCode.DONE:
                        const doneMessage = json as DoneMessage;
                        console.log("doneMessage", doneMessage)
                        setDeadline(doneMessage.nextGameStart);
                        setGameStarted(false);
                        setSquares(doneMessage.board);
                        setPlayerTurn(-1);
                        if (doneMessage.winner === myPlayerIndex) {
                            setMessage('You won!');
                        } else {
                            setMessage('You lost!');
                        }
                        break;
                    default:
                        break;
                }
            }
        };
    }

    // console.log(squares)

    useEffect(() => {
        const initNakama = async () => {
            nakamaRef.current = new Nakama();
            await nakamaRef.current.authenticate();
            initSocket();
        };
        initNakama();
    }, []);

    useEffect(() => {
        if (deadline !== null) {
            const intervalId = setInterval(() => {
                setTimeLeft(deadline * 1000 - Date.now());
            }, 1000);
            return () => clearInterval(intervalId);
        }
    }, [deadline]);

    function handleClick(i: number) {
        if (!gameStarted) {
            setMessage("Game hasn't started yet!");
            return;
        }
        if (!nakamaRef.current) return;

        if (playerTurn === playerIndex && squares[i] === null) {
            const nextSquares = squares.slice();
            nextSquares[i] = playerIndex;
            setSquares(nextSquares);
            nakamaRef.current.makeMove(i);
            setMessage("Wait for other player's turn!");
        } else if (playerTurn !== playerIndex) {
            setMessage("It's not your turn!");
        }
    }

    async function findMatch() {
        if (!nakamaRef.current) return;
        await nakamaRef.current.findMatch();
        if (nakamaRef.current.matchId === null) {
            setMessage('Server Error: Failed to find match!');
        }
        console.log('find match, matchId: ', nakamaRef.current.matchId!);
        setMessage('Wait for another player to join...');
    }

    // console.log(playerIndex)

    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-gray-800 text-white shadow-lg min-h-screen">
            <div className="text-lg font-semibold mb-4">{gameMessage}</div>
            <button onClick={findMatch} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Find Match
            </button>

            {gameStarted && (
                <div className="flex items-center justify-center space-x-4 mt-4">
                    <div className="w-36 text-center rounded-lg bg-gray-700 px-4 py-1 text-xl font-medium">
                        You are{' '}
                        <span className={`${playerIndex === 0 ? 'text-[#30c4bd]' : 'text-[#f3b236]'} text-2xl font-bold`}>
                            {playerIndex === 2 ? 'X' : 'O'}
                        </span>
                    </div>
                    <div className="w-28 text-center rounded-lg bg-gray-700 px-4 py-1 text-xl font-medium uppercase">
                        <span className={`${playerTurn === 0 ? 'text-[#30c4bd]' : 'text-[#f3b236]'} text-2xl font-bold`}>
                            {playerTurn === 2 ? 'X' : 'O'}
                        </span>{' '}
                        Turn
                    </div>
                </div>
            )}

            {deadline !== null && (
                <div className="text-center mt-4">
                    <div className="text-sm text-gray-400">
                        {gameStarted ? 'Time left:' : 'Game will start after: '}
                    </div>
                    <div className="text-2xl font-bold">
                        {timeLeft > 0 ? new Date(timeLeft).toISOString().substr(14, 5) : '0:00'}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-6">
                {squares.map((square, index) => (
                    <Square key={index} value={square} onSquareClick={() => handleClick(index)} />
                ))}
            </div>
        </div>
    );
}
