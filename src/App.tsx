import { Application, Container, Graphics, ICanvas } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Viewport } from "pixi-viewport";

enum SquareState {
    White,
    Black,
}

enum Direction {
    Up,
    Down,
    Left,
    Right,
}

const width = window.innerWidth;
const height = window.innerHeight - 100;
const squareSize = 10;

const newDirectionMap = {
    [Direction.Up]: {
        [SquareState.White]: Direction.Right,
        [SquareState.Black]: Direction.Left,
    },
    [Direction.Down]: {
        [SquareState.White]: Direction.Left,
        [SquareState.Black]: Direction.Right,
    },
    [Direction.Left]: {
        [SquareState.White]: Direction.Up,
        [SquareState.Black]: Direction.Down,
    },
    [Direction.Right]: {
        [SquareState.White]: Direction.Down,
        [SquareState.Black]: Direction.Up,
    },
};

export default function App() {
    const [stepTimeout, setStepTimeout] = useState(0);
    const pixiRef = useRef<Application<ICanvas>>();
    const container = useRef(new Container());
    const graphics = useRef(new Graphics());
    const squares = useRef<Record<number, Record<number, SquareState>>>({}); // { x: { y: SquareState } }. If x or y is not present, it's empty.
    const ant = useRef({ x: width / 2, y: height / 2, direction: Direction.Left });
    const stepNumber = useRef(0);
    const previousStepTime = useRef(0);
    const timeSum = useRef(0);
    const timeCount = useRef(0);

    useEffect(() => {
        pixiRef.current = new Application({ width, height, backgroundColor: "white", powerPreference: "high-performance", antialias: false });
        document.getElementById("pixi-container")!.appendChild(pixiRef.current.view as any);
        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000,
            worldHeight: 1000,
            events: pixiRef.current.renderer.events // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        })
        pixiRef.current.stage.addChild(viewport);
        viewport.addChild(container.current);
        viewport
            .drag()
            .pinch()
            .wheel();

        container.current!.addChild(graphics.current);
    }, []);

    function step() {
        stepNumber.current++;

        const nextClock = performance.now();
        const timeSinceLastStep = nextClock - previousStepTime.current;
        previousStepTime.current = nextClock;
        const stepsPerSecond = 1000 / timeSinceLastStep;
        timeSum.current += stepsPerSecond;

        document.getElementById("step")!.innerText = `Step: ${stepNumber.current}. Steps per second: ${(timeSum.current / ++timeCount.current).toFixed(2)}.`;

        const squareState = squares.current[ant.current.x]?.[ant.current.y] ?? SquareState.White;
        const newSquareState = squareState === SquareState.White ? SquareState.Black : SquareState.White;
        squares.current[ant.current.x] = { ...squares.current[ant.current.x], [ant.current.y]: newSquareState };
        ant.current.direction = newDirectionMap[ant.current.direction][squareState];

        fillSquare(ant.current.x, ant.current.y, newSquareState);

        switch (ant.current.direction) {
            case Direction.Up:
                ant.current.y -= squareSize;
                break;
            case Direction.Down:
                ant.current.y += squareSize;
                break;
            case Direction.Left:
                ant.current.x -= squareSize;
                break;
            case Direction.Right:
                ant.current.x += squareSize;
                break;
        }

        requestAnimationFrame(step);
    }

    function fillSquare(x: number, y: number, state: SquareState) {
        graphics.current.beginFill(state === SquareState.Black ? "black" : "white");
        graphics.current.drawRect(x, y, squareSize, squareSize);
        graphics.current.endFill();
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div id="pixi-container" style={{ height, width, outline: "solid black 1px" }} />
            <button onClick={step}>Go</button>
            <div id="step" />
        </div>
    );
}
