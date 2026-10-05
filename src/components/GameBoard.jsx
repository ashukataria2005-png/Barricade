import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, RotateCcw } from 'lucide-react';

export default function GameBoard({ onBack }) {
    const [turn, setTurn] = useState('red'); // 'red' starts at row 8, 'blue' starts at row 0
    const [redPos, setRedPos] = useState({ r: 8, c: 4 });
    const [bluePos, setBluePos] = useState({ r: 0, c: 4 });

    const [redWalls, setRedWalls] = useState(10);
    const [blueWalls, setBlueWalls] = useState(10);

    // walls: array of { r, c, orientation: 'h' | 'v' } (r, c from 0 to 7)
    const [walls, setWalls] = useState([]);
    const [wallOrientation, setWallOrientation] = useState('h'); // 'h' or 'v'
    const [winner, setWinner] = useState(null);
    const [warningMsg, setWarningMsg] = useState('');

    // Auto clear warning message
    useEffect(() => {
        if (warningMsg) {
            const t = setTimeout(() => setWarningMsg(''), 2500);
            return () => clearTimeout(t);
        }
    }, [warningMsg]);

    // Check if a wall blocks movement between (r1, c1) and (r2, c2)
    const isWallBetween = (r1, c1, r2, c2, wallList) => {
        // Horizontal step
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            // blocked by a vertical wall at (r1, minC) or (r1 - 1, minC)
            return wallList.some(
                w => w.orientation === 'v' && w.c === minC && (w.r === r1 || w.r === r1 - 1)
            );
        }
        // Vertical step
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            // blocked by a horizontal wall at (minR, c1) or (minR, c1 - 1)
            return wallList.some(
                w => w.orientation === 'h' && w.r === minR && (w.c === c1 || w.c === c1 - 1)
            );
        }
        return false;
    };

    // BFS check to ensure player has at least 1 path to target row
    const hasPathToGoal = (startPos, targetRow, wallList) => {
        const queue = [{ r: startPos.r, c: startPos.c }];
        const visited = new Set();
        visited.add(`${startPos.r},${startPos.c}`);

        const deltas = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 },
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.r === targetRow) return true;

            for (let d of deltas) {
                const nr = current.r + d.r;
                const nc = current.c + d.c;

                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                    const key = `${nr},${nc}`;
                    if (!visited.has(key)) {
                        if (!isWallBetween(current.r, current.c, nr, nc, wallList)) {
                            visited.add(key);
                            queue.push({ r: nr, c: nc });
                        }
                    }
                }
            }
        }
        return false;
    };

    // Valid pawn moves considering walls & jumps
    const getValidMoves = (pos, otherPos) => {
        const moves = [];
        const deltas = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 },
        ];

        deltas.forEach(d => {
            const nr = pos.r + d.r;
            const nc = pos.c + d.c;

            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                if (!isWallBetween(pos.r, pos.c, nr, nc, walls)) {
                    if (nr === otherPos.r && nc === otherPos.c) {
                        // Jump over opponent
                        const jumpR = nr + d.r;
                        const jumpC = nc + d.c;
                        if (
                            jumpR >= 0 &&
                            jumpR < 9 &&
                            jumpC >= 0 &&
                            jumpC < 9 &&
                            !isWallBetween(nr, nc, jumpR, jumpC, walls)
                        ) {
                            moves.push({ r: jumpR, c: jumpC });
                        }
                    } else {
                        moves.push({ r: nr, c: nc });
                    }
                }
            }
        });

        return moves;
    };

    const handleCellClick = (r, c) => {
        if (winner) return;

        const currentPos = turn === 'red' ? redPos : bluePos;
        const otherPos = turn === 'red' ? bluePos : redPos;
        const validMoves = getValidMoves(currentPos, otherPos);

        const isMoveValid = validMoves.some(m => m.r === r && m.c === c);

        if (isMoveValid) {
            if (turn === 'red') {
                setRedPos({ r, c });
                if (r === 0) setWinner('Red');
                else setTurn('blue');
            } else {
                setBluePos({ r, c });
                if (r === 8) setWinner('Blue');
                else setTurn('red');
            }
        }
    };

    const handlePlaceWall = (r, c) => {
        if (winner) return;
        const remaining = turn === 'red' ? redWalls : blueWalls;
        if (remaining <= 0) {
            setWarningMsg('No barricades remaining!');
            return;
        }

        // Check overlap or intersection
        const conflict = walls.some(w => {
            if (w.r === r && w.c === c) return true;
            if (wallOrientation === 'h' && w.orientation === 'h' && w.r === r && Math.abs(w.c - c) <= 1) return true;
            if (wallOrientation === 'v' && w.orientation === 'v' && w.c === c && Math.abs(w.r - r) <= 1) return true;
            return false;
        });

        if (conflict) {
            setWarningMsg('Wall overlaps or crosses another wall!');
            return;
        }

        const testWalls = [...walls, { r, c, orientation: wallOrientation }];

        // Quoridor validation: check both players can still finish
        const redCanWin = hasPathToGoal(redPos, 0, testWalls);
        const blueCanWin = hasPathToGoal(bluePos, 8, testWalls);

        if (!redCanWin || !blueCanWin) {
            setWarningMsg('Cannot completely block any player path!');
            return;
        }

        setWalls(testWalls);
        if (turn === 'red') {
            setRedWalls(redWalls - 1);
            setTurn('blue');
        } else {
            setBlueWalls(blueWalls - 1);
            setTurn('red');
        }
    };

    const currentPos = turn === 'red' ? redPos : bluePos;
    const otherPos = turn === 'red' ? bluePos : redPos;
    const validMoves = getValidMoves(currentPos, otherPos);

    return (
        <div className="flex flex-col h-full select-none max-w-md mx-auto">
            {/* Top Bar / Opponent (Blue) */}
            <div className="flex items-center justify-between bg-cardDark/90 p-3 rounded-2xl border border-borderDark/60 mb-2">
                <button onClick={onBack} className="p-1 hover:bg-borderDark rounded-lg">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/30" />
                    <span className="text-sm font-semibold">Blue Player</span>
                    <span className="text-xs text-gray-400">({blueWalls} walls left)</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'blue' ? 'bg-blue-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'}`}>
                    TURN
                </div>
            </div>

            {/* Warning Toast */}
            {warningMsg && (
                <div className="text-center text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/40 py-1.5 px-3 rounded-xl mb-2">
                    {warningMsg}
                </div>
            )}

            {/* Interactive 9x9 Board */}
            <div className="bg-[#18181b] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl relative">
                <div className="flex flex-col gap-1.5">
                    {Array.from({ length: 9 }).map((_, r) => (
                        <React.Fragment key={`row-${r}`}>
                            {/* Row of 9 Cells */}
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: 9 }).map((_, c) => {
                                    const isRed = redPos.r === r && redPos.c === c;
                                    const isBlue = bluePos.r === r && bluePos.c === c;
                                    const isValid = validMoves.some(m => m.r === r && m.c === c);

                                    return (
                                        <div
                                            key={`cell-${r}-${c}`}
                                            onClick={() => handleCellClick(r, c)}
                                            className={`flex-1 aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all ${isValid
                                                    ? 'bg-amber-500/25 border border-amber-400 hover:bg-amber-500/40 shadow-sm'
                                                    : 'bg-[#27272a] hover:bg-[#323238]'
                                                }`}
                                        >
                                            {isRed && (
                                                <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-2 ring-rose-500/30" />
                                            )}
                                            {isBlue && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-500/30" />
                                            )}
                                            {isValid && !isRed && !isBlue && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Inter-row groove for placing Horizontal Walls (rows 0 to 7) */}
                            {r < 8 && (
                                <div className="flex items-center gap-1.5 h-2">
                                    {Array.from({ length: 8 }).map((_, c) => {
                                        const hasHWall = walls.some(
                                            w => w.orientation === 'h' && w.r === r && (w.c === c || w.c === c - 1)
                                        );

                                        return (
                                            <div
                                                key={`h-slot-${r}-${c}`}
                                                onClick={() => wallOrientation === 'h' && handlePlaceWall(r, c)}
                                                className={`flex-1 h-full rounded-sm cursor-pointer transition-all ${hasHWall
                                                        ? 'bg-amber-500 shadow-sm'
                                                        : 'hover:bg-amber-500/30'
                                                    }`}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Bottom Bar / Current User (Red) */}
            <div className="flex items-center justify-between bg-cardDark/90 p-3 rounded-2xl border border-borderDark/60 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/30" />
                    <span className="text-sm font-semibold">Red Player</span>
                    <span className="text-xs text-gray-400">({redWalls} walls left)</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'red' ? 'bg-rose-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'}`}>
                    TURN
                </div>
            </div>

            {/* Wall Orientation Toggle Controls */}
            <div className="flex items-center justify-between gap-3 mt-3">
                <button
                    onClick={() => setWallOrientation('h')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${wallOrientation === 'h'
                            ? 'bg-brandOrange text-black border-brandOrange shadow-lg shadow-brandOrange/20'
                            : 'bg-cardDark border-borderDark text-gray-300 hover:bg-borderDark/40'
                        }`}
                >
                    <Shield size={14} />
                    <span>Horizontal Mode</span>
                </button>
                <button
                    onClick={() => setWallOrientation('v')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${wallOrientation === 'v'
                            ? 'bg-brandOrange text-black border-brandOrange shadow-lg shadow-brandOrange/20'
                            : 'bg-cardDark border-borderDark text-gray-300 hover:bg-borderDark/40'
                        }`}
                >
                    <Shield size={14} className="rotate-90" />
                    <span>Vertical Mode</span>
                </button>
            </div>

            {/* Winner Popup */}
            {winner && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-cardDark border border-borderDark rounded-2xl p-6 text-center max-w-xs w-full shadow-2xl">
                        <h3 className="text-xl font-black text-brandOrange mb-1">{winner} Player Wins!</h3>
                        <p className="text-xs text-gray-400 mb-5">Reached the opposite baseline.</p>
                        <button
                            onClick={() => {
                                setRedPos({ r: 8, c: 4 });
                                setBluePos({ r: 0, c: 4 });
                                setRedWalls(10);
                                setBlueWalls(10);
                                setWalls([]);
                                setWinner(null);
                                setTurn('red');
                            }}
                            className="w-full bg-brandGreen hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={14} />
                            <span>Play Rematch</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}