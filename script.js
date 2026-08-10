// --- PARAMETERS (State Variables) ---
let currentScene = 0; 
let autoData = [];

// --- LOAD DATA ---
d3.csv("https://flunky.github.io/cars2017.csv").then(function(data) {
  autoData = data;
  renderScene(); // Initialize first scene
});

// --- TRIGGERS (Event Listeners) ---
d3.select("#nextBtn").on("click", () => {
  if (currentScene < 2) currentScene++;
  renderScene();
});

d3.select("#prevBtn").on("click", () => {
  if (currentScene > 0) currentScene--;
  renderScene();
});

// --- SCENE RENDERING ---
function renderScene() {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove(); // Clear previous scene

  // Common visual structure (scales, axes) goes here...

  if (currentScene === 0) {
    // Build Scene 1: Plot all data, add generic title
  } else if (currentScene === 1) {
    // Build Scene 2: Color Electric cars differently
    // Add d3-annotation pointing to them
  } else if (currentScene === 2) {
    // Build Scene 3: Add dropdown/buttons for user to filter by Cylinders
    // Implement tooltips (mouseover events) for free-form exploration
  }
  
  // Update button visibility based on currentScene
}
