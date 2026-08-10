// --- PARAMETERS (State Variables) ---
let currentScene = 0;
let autoData = [];
let filteredData = [];
let currentFilter = "All";

// --- DIMENSIONS & SCALES ---
const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Setup SVG with a viewBox for responsiveness
const svg = d3.select("#chart")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let xScale, yScale;
const annotationGroup = svg.append("g").attr("class", "annotation-group");

// --- INITIALIZATION ---
async function init() {
    try {
        // Await the data load
        const rawData = await d3.csv("https://flunky.github.io/cars2017.csv");
        
        // Parse numerical values to avoid string arithmetic bugs
        autoData = rawData.map(d => ({
            make: d.Make,
            fuel: d.Fuel,
            cylinders: +d.EngineCylinders,
            cityMPG: +d.AverageCityMPG,
            hwyMPG: +d.AverageHighwayMPG
        }));

        filteredData = autoData;

        // Initialize scales based on data extents
        xScale = d3.scaleLinear()
            .domain([0, d3.max(autoData, d => d.cityMPG) + 10])
            .range([0, width]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max(autoData, d => d.hwyMPG) + 10])
            .range([height, 0]);

        // Add X & Y Axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(10))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("font-size", "14px")
            .text("Average City MPG");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(10))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("text-anchor", "middle")
            .text("Average Highway MPG");

        setupTriggers();
        renderScene();
    } catch (error) {
        console.error("Error loading data:", error);
        d3.select("#scene-description").text("Failed to load data.");
    }
}

// --- TRIGGERS (Event Listeners) ---
function setupTriggers() {
    d3.select("#nextBtn").on("click", () => {
        if (currentScene < 2) currentScene++;
        renderScene();
    });

    d3.select("#prevBtn").on("click", () => {
        if (currentScene > 0) currentScene--;
        renderScene();
    });

    // Drill-down filtering in Scene 3
    d3.selectAll("#filter-controls button").on("click", function() {
        d3.selectAll("#filter-controls button").classed("active", false);
        d3.select(this).classed("active", true);
        currentFilter = this.getAttribute("data-cyl");
        
        if (currentFilter === "All") {
            filteredData = autoData;
        } else {
            filteredData = autoData.filter(d => d.cylinders === +currentFilter);
        }
        updateChart(true);
    });
}

// --- SCENE MANAGEMENT ---
function renderScene() {
    const title = d3.select("#scene-title");
    const desc = d3.select("#scene-description");
    const prevBtn = d3.select("#prevBtn");
    const nextBtn = d3.select("#nextBtn");
    const filterControls = d3.select("#filter-controls");

    // Clear annotations between scenes
    annotationGroup.selectAll("*").remove();
    filteredData = autoData; // Reset data filter by default

    // Update UI controls visibility and states
    prevBtn.property("disabled", currentScene === 0);
    nextBtn.property("disabled", currentScene === 2);
    filterControls.classed("hidden", currentScene !== 2);

    switch (currentScene) {
        case 0:
            title.text("Scene 1: Overall Fuel Efficiency");
            desc.text("A macro view of the 2017 automobile market shows a strong linear correlation between City and Highway MPG.");
            updateChart(false);
            break;
            
        case 1:
            title.text("Scene 2: The Electric Advantage");
            desc.text("When we isolate Electric Vehicles, the leap in efficiency becomes starkly apparent, creating a distinct cluster far removed from combustion engines.");
            updateChart(false);
            drawAnnotation(); // Trigger d3-annotation
            break;

        case 2:
            title.text("Scene 3: Explore the Data");
            desc.text("Filter by engine cylinders to see how engine size impacts fuel economy. Hover over data points for specific vehicle details.");
            
            // Re-apply the current filter if the user navigates back to scene 3
            if (currentFilter !== "All") {
                filteredData = autoData.filter(d => d.cylinders === +currentFilter);
                d3.selectAll("#filter-controls button").classed("active", false);
                d3.select(`button[data-cyl="${currentFilter}"]`).classed("active", true);
            }
            updateChart(true); // Enable tooltips
            break;
    }
}

// --- RENDERING LOGIC ---
function updateChart(interactive) {
    // Data join with a compound key to maintain object constancy during transitions
    const circles = svg.selectAll("circle")
        .data(filteredData, d => d.make + d.fuel + d.cylinders); 

    // Advanced D3 v7 Enter/Update/Exit pattern using .join()
    circles.join(
        enter => enter.append("circle")
            .attr("cx", d => xScale(d.cityMPG))
            .attr("cy", d => yScale(d.hwyMPG))
            .attr("r", 0)
            .attr("fill", d => getFillColor(d))
            .attr("opacity", d => getOpacity(d))
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .call(enter => enter.transition().duration(800)
                .attr("r", 5)),
        update => update
            .call(update => update.transition().duration(800)
                .attr("cx", d => xScale(d.cityMPG))
                .attr("cy", d => yScale(d.hwyMPG))
                .attr("fill", d => getFillColor(d))
                .attr("opacity", d => getOpacity(d))),
        exit => exit
            .call(exit => exit.transition().duration(500)
                .attr("r", 0)
                .remove())
    );

    // Apply or remove interactivity based on the scene
    if (interactive) {
        svg.selectAll("circle")
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
    } else {
        svg.selectAll("circle")
            .on("mouseover", null)
            .on("mouseout", null);
        hideTooltip();
    }
}

// --- HELPER FUNCTIONS ---
function getFillColor(d) {
    if (currentScene === 1) {
        return d.fuel === "Electricity" ? "#198754" : "#ccc"; // Highlight EVs in green
    }
    if (currentScene === 2) {
        const colors = {0: "#198754", 4: "#0d6efd", 6: "#fd7e14", 8: "#dc3545"};
        return colors[d.cylinders] || "#6c757d"; // Color by cylinder count
    }
    return "#0d6efd"; // Default blue for Scene 1
}

function getOpacity(d) {
    if (currentScene === 1) {
        return d.fuel === "Electricity" ? 0.9 : 0.2; // Fade non-EVs into the background
    }
    return 0.7;
}

function showTooltip(event, d) {
    d3.select(this)
        .transition().duration(200)
        .attr("r", 8)
        .attr("stroke-width", 2);

    const tooltip = d3.select("#tooltip");
    
    // Position tooltip relative to the mouse cursor
    const [x, y] = d3.pointer(event, document.body);
    
    tooltip.classed("hidden", false)
        .style("left", (x + 15) + "px")
        .style("top", (y - 15) + "px")
        .html(`
            <strong>Make:</strong> ${d.make}<br>
            <strong>Fuel:</strong> ${d.fuel}<br>
            <strong>Cylinders:</strong> ${d.cylinders}<br>
            <strong>City MPG:</strong> ${d.cityMPG}<br>
            <strong>Hwy MPG:</strong> ${d.hwyMPG}
        `);
}

function hideTooltip() {
    d3.selectAll("circle")
        .transition().duration(200)
        .attr("r", 5)
        .attr("stroke-width", 0.5);

    d3.select("#tooltip").classed("hidden", true);
}

function drawAnnotation() {
    const annotations = [{
        note: {
            label: "Electric vehicles form a distinct cluster with efficiency far exceeding combustion engines.",
            title: "The EV Cluster",
            wrap: 250,
            padding: 10
        },
        color: ["#198754"],
        x: xScale(115),
        y: yScale(105),
        dy: 50,
        dx: -50
    }];

    const makeAnnotations = d3.annotation()
        .type(d3.annotationCalloutElbow)
        .annotations(annotations);

    annotationGroup
        .style("opacity", 0)
        .call(makeAnnotations)
        .transition().duration(1000).delay(500)
        .style("opacity", 1);
}

// Start application
init();
