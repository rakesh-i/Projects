const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const cols = 10, rows = 15;
const cellSize = 40;
const stack = [];
const grid = [];
let adjacencyList = {}; // Graph representation

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.visited = false;
        this.neighbors = []; // Store connections
    }

    connectTo(next) {
        this.neighbors.push(next);
        next.neighbors.push(this); // Ensure bidirectional connection

        // Add to adjacency list
        const key = `${this.x},${this.y}`;
        const nextKey = `${next.x},${next.y}`;

        if (!adjacencyList[key]) adjacencyList[key] = [];
        if (!adjacencyList[nextKey]) adjacencyList[nextKey] = [];

        adjacencyList[key].push(nextKey);
        adjacencyList[nextKey].push(key);
    }

    drawLineTo(next) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 20;
        ctx.lineCap = "square";

        ctx.beginPath();
        ctx.moveTo(this.x * cellSize + cellSize / 2, this.y * cellSize + cellSize / 2);
        ctx.lineTo(next.x * cellSize + cellSize / 2, next.y * cellSize + cellSize / 2);
        ctx.stroke();

        this.connectTo(next);
    }
}

// Initialize grid
for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
        grid[y][x] = new Cell(x, y);
    }
}

let current = grid[0][0];
current.visited = true;
stack.push(current);

function getUnvisitedNeighbors(cell) {
    const { x, y } = cell;
    const neighbors = [];

    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];

    for (const { dx, dy } of directions) {
        const nx = x + dx, ny = y + dy;
        if (grid[ny] && grid[ny][nx] && !grid[ny][nx].visited) {
            neighbors.push(grid[ny][nx]);
        }
    }

    return neighbors;
}

function getNeighbors(cell) {
    const { x, y } = cell;
    const neighbors = [];

    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];

    for (const { dx, dy } of directions) {
        const nx = x + dx, ny = y + dy;
        if (grid[ny] && grid[ny][nx]) {
            neighbors.push(grid[ny][nx]);
        }
    }
    return neighbors;
}

function generateMaze() {
    if (stack.length > 0) {
        let neighbors = getUnvisitedNeighbors(current);

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            current.drawLineTo(next);
            next.visited = true;
            stack.push(next);
            current = next;
        } else {
            current = stack.pop();
        }

        requestAnimationFrame(generateMaze);
    } else {
        addCycles();
        console.log("Adjacency List:", adjacencyList); // Log the adjacency list after maze generation
    }
}

function addCycles() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = grid[y][x];
            let neighbors = getNeighbors(cell);
            if (neighbors.length > 0 && Math.random() < 0.1) { // 30% chance to create a cycle
                let randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                cell.drawLineTo(randomNeighbor);
            }
        }
    }
}


let startCell = null;
let endCell = null;


function findShortestPath(startCell, endCell) {
    const startKey = `${startCell.x},${startCell.y}`;
    const endKey = `${endCell.x},${endCell.y}`;
    
    // BFS Setup
    const queue = [startKey];
    const cameFrom = {}; // Stores path history
    cameFrom[startKey] = null; // Start has no previous node
    
    while (queue.length > 0) {
        const currentKey = queue.shift(); // Dequeue

        // If we reached the end cell, reconstruct the path
        if (currentKey === endKey) {
            return reconstructPath(cameFrom, startKey, endKey);
        }

        // Visit neighbors
        if (adjacencyList[currentKey]) {
            for (const neighbor of adjacencyList[currentKey]) {
                if (!(neighbor in cameFrom)) { // If not visited
                    queue.push(neighbor);
                    cameFrom[neighbor] = currentKey; // Track path
                }
            }
        }
    }

    return []; // No path found
}

// Backtrack from end to start to get the path
function reconstructPath(cameFrom, startKey, endKey) {
    let path = [];
    let current = endKey;

    while (current !== null) {
        path.push(current);
        current = cameFrom[current]; // Move backwards
    }

    path.reverse(); // Reverse to get start → end order
    return path;
}

// Draw the shortest path
function drawPath(path) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 5;

    ctx.beginPath();

    for (let i = 0; i < path.length - 1; i++) {
        const [x1, y1] = path[i].split(",").map(Number);
        const [x2, y2] = path[i + 1].split(",").map(Number);

        ctx.moveTo(x1 * cellSize + cellSize / 2, y1 * cellSize + cellSize / 2);
        ctx.lineTo(x2 * cellSize + cellSize / 2, y2 * cellSize + cellSize / 2);
    }

    ctx.stroke();
}

function findAllPaths(startCell, endCell) {
    const startKey = `${startCell.x},${startCell.y}`;
    const endKey = `${endCell.x},${endCell.y}`;
    const allPaths = [];
    const currentPath = [];
    
    function dfs(currentKey, visited) {
        currentPath.push(currentKey);
        visited.add(currentKey);

        if (currentKey === endKey) {
            allPaths.push([...currentPath]); // Store found path
        } else {
            if (adjacencyList[currentKey]) {
                for (const neighbor of adjacencyList[currentKey]) {
                    if (!visited.has(neighbor)) { // Avoid cycles in a single path
                        dfs(neighbor, visited);
                    }
                }
            }
        }

        // Backtrack
        currentPath.pop();
        visited.delete(currentKey);
    }

    dfs(startKey, new Set());

    return allPaths;
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 256); // Red (0-255)
    const g = Math.floor(Math.random() * 256); // Green (0-255)
    const b = Math.floor(Math.random() * 256); // Blue (0-255)
    return `rgb(${r},${g},${b})`;
}

function drawAllPaths(paths) {
    // const colors = ["blue", "orange", "purple", "pink", "yellow", "cyan"];
    // let colorIndex = 0;

    for (const path of paths) {
        ctx.strokeStyle = getRandomColor();
        ctx.lineWidth = 4;
        ctx.beginPath();

        for (let i = 0; i < path.length - 1; i++) {
            const [x1, y1] = path[i].split(",").map(Number);
            const [x2, y2] = path[i + 1].split(",").map(Number);

            ctx.moveTo(x1 * cellSize + cellSize / 2, y1 * cellSize + cellSize / 2);
            ctx.lineTo(x2 * cellSize + cellSize / 2, y2 * cellSize + cellSize / 2);
        }

        ctx.stroke();
        // colorIndex++; // Change color for next path
    }
}


let shortest = [];
let alltracks = [];

function solveall() {
    const allPaths = findAllPaths(startCell, endCell);
    alltracks = [...allPaths];
    if (allPaths.length > 0) {
        drawAllPaths(allPaths);
        console.log("All Paths:", allPaths);
    } else {
        console.log("No paths found!");
    }
}


function solve(){
    const path = findShortestPath(startCell, endCell);
    shortest = [...path];
    if (path.length > 0) {
        drawPath(path);
        console.log("Shortest Path:", path);
    } else {
        console.log("No path found!");
    }
}

canvas.addEventListener("click", function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    const clickedCell = grid[y][x];

    if (!startCell) {
        startCell = clickedCell;
        drawPoint(startCell, "red"); // Mark start point
    } else if (!endCell && clickedCell !== startCell) {
        endCell = clickedCell;
        drawPoint(endCell, "green"); // Mark end point
    } 
});

// Function to clear start and end points when button is clicked
function clearStartEndPoints() {
    if (startCell) clearPoint(startCell);
    if (endCell) clearPoint(endCell);
    startCell = null;
    endCell = null;
    clearPath(shortest);
    for(let i=0; i<alltracks.length; i++){
        clearPath(alltracks[i]);
    }
}

function clearPath(path) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 6;

    ctx.beginPath();

    for (let i = 0; i < path.length - 1; i++) {
        const [x1, y1] = path[i].split(",").map(Number);
        const [x2, y2] = path[i + 1].split(",").map(Number);

        ctx.moveTo(x1 * cellSize + cellSize / 2, y1 * cellSize + cellSize / 2);
        ctx.lineTo(x2 * cellSize + cellSize / 2, y2 * cellSize + cellSize / 2);
    }

    ctx.stroke();
}

// Function to clear a specific point
function clearPoint(cell) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(cell.x * cellSize + cellSize / 2, cell.y * cellSize + cellSize / 2, 10, 0, Math.PI * 2);
    ctx.fill();
}

// Function to draw start or end points without erasing the maze
function drawPoint(cell, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
        cell.x * cellSize + cellSize / 2,
        cell.y * cellSize + cellSize / 2,
        9,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function redrawMaze() {
    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 20;
    ctx.lineCap = "square";

    // Draw connections based on adjacency list
    for (const key in adjacencyList) {
        const [x1, y1] = key.split(",").map(Number);
        for (const neighbor of adjacencyList[key]) {
            const [x2, y2] = neighbor.split(",").map(Number);

            ctx.beginPath();
            ctx.moveTo(x1 * cellSize + cellSize / 2, y1 * cellSize + cellSize / 2);
            ctx.lineTo(x2 * cellSize + cellSize / 2, y2 * cellSize + cellSize / 2);
            ctx.stroke();
        }
    }
}

function saveMaze() {
    const dataStr = JSON.stringify(adjacencyList);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    
    link.href = URL.createObjectURL(blob);
    link.download = "maze.json";
    link.click();
}

function loadMaze(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            adjacencyList = JSON.parse(e.target.result);
            redrawMaze();
        } catch (error) {
            console.error("Invalid file format", error);
        }
    };
    reader.readAsText(file);
}


document.getElementById("download").addEventListener("click", function() {
    const link = document.createElement("a");
    link.download = "maze.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

document.getElementById("loadMazeFile").addEventListener("change", loadMaze);

const clearButton = document.createElement("button");
clearButton.innerText = "Clear Points";
clearButton.style.marginTop = "10px";
clearButton.addEventListener("click", clearStartEndPoints);
document.body.appendChild(clearButton);


// Set canvas size and background
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Start maze generation
// generateMaze();

