import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Shield, RotateCcw } from 'lucide-react';

export default function GameBoard({ onBack }) {
    // Turn: 'red' | 'blue'
    const [turn, setTurn] = useState('red');

    // Positions: 0 to 8
    const [redPos, setRedPos] = useState({ r: 8, c: 4 });
    const [bluePos, setBluePos] = useState({ r: 0, c: 4 });

    // Walls left
    const [redWalls, setRedWalls] = useState(10);
    const [blueWalls, setBlueWalls] = useState(10);

    // Placed walls: array of { r, c, orientation: 'h' | 'v' } (r: 0-7, c: 0-7)
    const [walls, setWalls] = useState([]);

    // Individual player orientation controls
    const [blueOrientation, setBlueOrientation] = useState('h');
    const [redOrientation, setRedOrientation] = useState('h');

    // Timers (seconds)
    const [blueTime, setBlueTime] = useState(300);
    const [redTime, setRedTime] = useState(300);

    const [winner, setWinner] = useState(null);
    const [warningMsg, setWarningMsg] = useState('');

    // Clock countdown logic
    useEffect(() => {
        if (winner) return;
        const interval = setInterval(() => {
            if (turn === 'red') {
                setRedTime((prev) => {
                    if (prev <= 1) {
                        setWinner('Blue (Time out)');
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setBlueTime((prev) => {
                    if (prev <= 1) {
                        setWinner('Red (Time out)');
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [turn, winner]);

    // Format time mm:ss
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Warning auto-hide
    useEffect(() => {
        if (warningMsg) {
            const timer = setTimeout(() => setWarningMsg(''), 2200);
            return () => clearTimeout(timer);
        }
    }, [warningMsg]);

    // Check if edge between (r1, c1) and (r2, c2) is blocked by walls
    const isWallBetween = (r1, c1, r2, c2, wallList) => {
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            return wallList.some(
                w => w.orientation === 'v' && w.c === minC && (w.r === r1 || w.r === r1 - 1)
            );
        }
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            return wallList.some(
                w => w.orientation === 'h' && w.r === minR && (w.c === c1 || w.c === c1 - 1)
            );
        }
        return false;
    };

    // BFS check to verify baseline reachability
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
            const curr = queue.shift();
            if (curr.r === targetRow) return true;

            for (let d of deltas) {
                const nr = curr.r + d.r;
                const nc = curr.c + d.c;

                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                    const key = `${nr},${nc}`;
                    if (!visited.has(key)) {
                        if (!isWallBetween(curr.r, curr.c, nr, nc, wallList)) {
                            visited.add(key);
                            queue.push({ r: nr, c: nc });
                        }
                    }
                }
            }
        }
        return false;
    };

    // Valid moves for current pawn
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

        if (validMoves.some(m => m.r === r && m.c === c)) {
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
        const isRed = turn === 'red';
        const remaining = isRed ? redWalls : blueWalls;
        const activeOrientation = isRed ? redOrientation : blueOrientation;

        if (remaining <= 0) {
            setWarningMsg('No barricades remaining!');
            return;
        }

        // Overlap / intersection check
        const overlap = walls.some(w => {
            if (w.r === r && w.c === c) return true;
            if (activeOrientation === 'h') {
                if (w.orientation === 'h' && w.r === r && Math.abs(w.c - c) <= 1) return true;
            } else {
                if (w.orientation === 'v' && w.c === c && Math.abs(w.r - r) <= 1) return true;
            }
            return false;
        });

        if (overlap) {
            setWarningMsg('Barricade overlaps or crosses another wall!');
            return;
        }

        const testWalls = [...walls, { r, c, orientation: activeOrientation }];

        // Path check
        if (!hasPathToGoal(redPos, 0, testWalls) || !hasPathToGoal(bluePos, 8, testWalls)) {
            setWarningMsg('Cannot completely trap any player!');
            return;
        }

        setWalls(testWalls);
        if (isRed) {
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
        <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1">
            {/* ───────────────── TOP PLAYER SECTION (BLUE) ───────────────── */}
            <div className={`p-3 rounded-2xl border transition-all ${turn === 'blue' ? 'bg-blue-950/20 border-blue-500/60' : 'bg-cardDark/80 border-borderDark/40'}`}>
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="p-1 hover:bg-borderDark rounded-lg">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
                        <span className="text-sm font-bold text-gray-200">Blue Player</span>
                        <span className="text-xs text-blue-400 font-semibold">({blueWalls} walls)</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'blue' ? 'bg-blue-600 text-white animate-pulse' : 'bg-bgDark text-gray-400'}`}>
                        {formatTime(blueTime)}
                    </div>
                </div>

                {/* Blue Player Wall Controls */}
                <div className="flex items-center gap-2 mt-2.5">
                    <button
                        onClick={() => setBlueOrientation('h')}
                        disabled={turn !== 'blue'}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${blueOrientation === 'h'
                                ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                                : 'bg-bgDark/60 border-borderDark/60 text-gray-400'
                            } ${turn !== 'blue' && 'opacity-40 cursor-not-allowed'}`}
                    >
                        <Shield size={12} />
                        <span>Horizontal Wall</span>
                    </button>
                    <button
                        onClick={() => setBlueOrientation('v')}
                        disabled={turn !== 'blue'}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${blueOrientation === 'v'
                                ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                                : 'bg-bgDark/60 border-borderDark/60 text-gray-400'
                            } ${turn !== 'blue' && 'opacity-40 cursor-not-allowed'}`}
                    >
                        <Shield size={12} className="rotate-90" />
                        <span>Vertical Wall</span>
                    </button>
                </div>
            </div>

            {/* Warning Toast */}
            {warningMsg && (
                <div className="text-center text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/60 py-1.5 px-3 rounded-xl my-1 animate-bounce">
                    {warningMsg}
                </div>
            )}

            {/* ───────────────── BOARD CONTAINER ───────────────── */}
            <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">

                {/* 9x9 Cells Grid */}
                <div className="grid grid-cols-9 grid-rows-9 gap-2 w-full h-full">
                    {Array.from({ length: 9 }).map((_, r) =>
                        Array.from({ length: 9 }).map((_, c) => {
                            const isRed = redPos.r === r && redPos.c === c;
                            const isBlue = bluePos.r === r && bluePos.c === c;
                            const isValid = validMoves.some(m => m.r === r && m.c === c);

                            return (
                                <div
                                    key={`cell-${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`relative flex items-center justify-center rounded-lg cursor-pointer transition-all aspect-square ${isValid
                                            ? 'bg-amber-500/20 border-2 border-amber-400 shadow-sm'
                                            : 'bg-[#26262a] hover:bg-[#303036]'
                                        }`}
                                >
                                    {isRed && (
                                        <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-2 ring-rose-500/40" />
                                    )}
                                    {isBlue && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-500/40" />
                                    )}
                                    {isValid && !isRed && !isBlue && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ───────────────── SOLID CONTINUOUS WALLS LAYER ───────────────── */}
                <div className="absolute inset-3 pointer-events-none">
                    {walls.map((w, idx) => {
                        // Precise CSS percentage placement based on 9 cells + 8 gaps
                        const leftPct = (w.c + 1) * (100 / 9);
                        const topPct = (w.r + 1) * (100 / 9);

                        if (w.orientation === 'h') {
                            // Horizontal wall spans exactly 2 cells length horizontally
                            return (
                                <div
                                    key={`wall-${idx}`}
                                    style={{
                                        left: `${w.c * (100 / 9)}%`,
                                        top: `calc(${topPct}% - 4px)`,
                                        width: `${(200 / 9)}%`,
                                        height: '8px',
                                    }}
                                    className="absolute bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
                                />
                            );
                        } else {
                            // Vertical wall spans exactly 2 cells height vertically
                            return (
                                <div
                                    key={`wall-${idx}`}
                                    style={{
                                        left: `calc(${leftPct}% - 4px)`,
                                        top: `${w.r * (100 / 9)}%`,
                                        width: '8px',
                                        height: `${(200 / 9)}%`,
                                    }}
                                    className="absolute bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
                                />
                            );
                        }
                    })}
                </div>

                {/* ───────────────── INVISIBLE TOUCH SENSORS (8x8) ───────────────── */}
                <div className="absolute inset-3 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, r) =>
                        Array.from({ length: 8 }).map((_, c) => {
                            const leftPct = (c + 1) * (100 / 9);
                            const topPct = (r + 1) * (100 / 9);

                            return (
                                <div
                                    key={`sensor-${r}-${c}`}
                                    onClick={() => handlePlaceWall(r, c)}
                                    style={{
                                        left: `${leftPct}%`,
                                        top: `${topPct}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className="absolute w-8 h-8 rounded-full pointer-events-auto cursor-pointer z-30 transition-all hover:bg-amber-400/20 active:scale-95"
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* ───────────────── BOTTOM PLAYER SECTION (RED) ───────────────── */}
            <div className={`p-3 rounded-2xl border transition-all ${turn === 'red' ? 'bg-rose-950/20 border-rose-500/60' : 'bg-cardDark/80 border-borderDark/40'}`}>
                {/* Red Player Wall Controls */}
                <div className="flex items-center gap-2 mb-2.5">
                    <button
                        onClick={() => setRedOrientation('h')}
                        disabled={turn !== 'red'}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${redOrientation === 'h'
                                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                : 'bg-bgDark/60 border-borderDark/60 text-gray-400'
                            } ${turn !== 'red' && 'opacity-40 cursor-not-allowed'}`}
                    >
                        <Shield size={12} />
                        <span>Horizontal Wall</span>
                    </button>
                    <button
                        onClick={() => setRedOrientation('v')}
                        disabled={turn !== 'red'}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${redOrientation === 'v'
                                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                : 'bg-bgDark/60 border-borderDark/60 text-gray-400'
                            } ${turn !== 'red' && 'opacity-40 cursor-not-allowed'}`}
                    >
                        <Shield size={12} className="rotate-90" />
                        <span>Vertical Wall</span>
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
                        <span className="text-sm font-bold text-gray-200">Red Player</span>
                        <span className="text-xs text-rose-400 font-semibold">({redWalls} walls)</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'red' ? 'bg-rose-600 text-white animate-pulse' : 'bg-bgDark text-gray-400'}`}>
                        {formatTime(redTime)}
                    </div>
                </div>
            </div>

            {/* Winner Popup */}
            {winner && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-cardDark border border-borderDark rounded-2xl p-6 text-center max-w-xs w-full shadow-2xl">
                        <h3 className="text-xl font-black text-brandOrange mb-1">{winner} Player Wins!</h3>
                        <p className="text-xs text-gray-400 mb-5">Objective completed.</p>
                        <button
                            onClick={() => {
                                setRedPos({ r: 8, c: 4 });
                                setBluePos({ r: 0, c: 4 });
                                setRedWalls(10);
                                setBlueWalls(10);
                                setWalls([]);
                                setBlueTime(300);
                                setRedTime(300);
                                setWinner(null);
                                setTurn('red');
                            }}
                            className="w-full bg-brandGreen hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
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