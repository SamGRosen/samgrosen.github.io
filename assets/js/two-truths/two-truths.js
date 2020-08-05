// Constants
const mindistance = 40;
const STANDARD_CONTROLS = ["embedding", "clusterNum", "reset", "refit", "spectral", "spawn"];
const EXTRA_CONTROLS = ["showTrue", "generate"];
const clusterStyles = ["adjacency", "laplacian", "normLaplacian"];

const nodeRadius = 5;
const nodeOpacity = 0.85;
const durationTime = 500;
const graphTransition = d3.transition().duration(durationTime);

const clusterColors = d3.schemeTableau10.slice();
clusterColors.push(...d3.schemeSet2);
clusterColors.push(...d3.schemeSet3);

const trueClusterColors = d3.schemeCategory10.slice(2);

const tooltip = d3.select("body")
    .append("div")
    .attr("id", "control-tooltip")

// https://stackoverflow.com/a/13627586/
const ordinalSuffixOf = (i) => {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}
const inrange = ({ x: sx, y: sy }, { x: tx, y: ty }) => Math.hypot(sx - tx, sy - ty) <= mindistance;

const getAvailableColors = (numberOfClusters) => {
    // By pushing to clusterColors we ensure consistent cluster colors across views
    while (clusterColors.length < numberOfClusters) {
        clusterColors.push("#" + Math.floor(Math.random() * 16777215).toString(16));
    }
    return clusterColors;
}

const getConsistentClusters = (clusterAssignments) => { // O(numberNodes * numberUniqueAssignments)
    /*  Could easily be faster but going for simplicity
        Maps each cluster assignment to the index of the first element in clusterAssignments
        that has this cluster and then maps that back to the range of the values in clusterAssignments.
        This ensures that the color of the first node added to the graph is ALWAYS clusterColors[0]
        and that all nodes in the community of that first node have the same color.
        Allows user to add nodes without switching of cluster colors. */
    const possibleAssignments = [...new Set(clusterAssignments)]
    const firstIndexWithAssignment = new Map();
    for (const assignment of possibleAssignments) {
        firstIndexWithAssignment.set(assignment, clusterAssignments.indexOf(assignment))
    }
    const mappedToFirstIndex = clusterAssignments.map(d => firstIndexWithAssignment.get(d))
    const possibleIndices = [...new Set(firstIndexWithAssignment.values())]
    possibleIndices.sort((a, b) => a - b);
    const mappedBackToOriginalIndexSpace = new Map();
    possibleIndices.forEach((firstIndex, newIndex) => mappedBackToOriginalIndexSpace.set(firstIndex, newIndex))

    return mappedToFirstIndex.map(d => mappedBackToOriginalIndexSpace.get(d))
}

const adjacencySpectralEmbedding = (adjMatrix, numberOfClusters) => {
    /* 
        The referenced paper wants scaled eigenvectors returned but it really does not matter since its
        just a transformation of the axis in the lower-dimensional space. The only potential difference
        is a more well-behaved set for the kmeans algorithm.
    */
    const eigendecomp = math.eigs(adjMatrix)
    const eigenValues = eigendecomp.values.toArray();
    const copiedEigenValues = eigenValues.slice();
    const topEigenValues = copiedEigenValues.sort((a, b) => Math.abs(b) - Math.abs(a)).slice(0, numberOfClusters);
    const indicesOfTopEValues = topEigenValues.map(eValue => eigenValues.indexOf(eValue));

    const topEigenvectors = math.subset(eigendecomp.vectors,
        math.index(
            math.range(0, adjMatrix.size()[0]),
            indicesOfTopEValues
        )
    );

    return topEigenvectors._data;
}

const laplacianSpectralEmbedding = (adjMatrix, numberOfClusters, normalized = true) => {
    const degree_vector = math.multiply(adjMatrix, math.ones(adjMatrix.size()[0]))
    const degree_matrix = math.diag(degree_vector.valueOf().map(d => d[0]), 0, "sparse")
    const laplacianMatrix = math.subtract(degree_matrix, adjMatrix);
    let matrix_to_eigen = laplacianMatrix;
    if (normalized) {
        const invsqrtDegree_matrix = math.diag(
            degree_vector.valueOf().map(d => d[0] !== 0 ? 1 / math.sqrt(d[0]) : 0))
        matrix_to_eigen = math.multiply(math.multiply(invsqrtDegree_matrix, laplacianMatrix), invsqrtDegree_matrix)
    }
    const eigendecomp = math.eigs(matrix_to_eigen)
    const numComponents = eigendecomp.values.toArray().filter(e => e < 1e-10).length
    const topEigenvectors = math.subset(eigendecomp.vectors,
        math.index(
            math.range(0, adjMatrix.size()[0]),
            math.range(numComponents, numComponents + numberOfClusters) // Laplacian based methods use first k non-trivial eigenvectors
        ))

    return topEigenvectors._data;
}

const getTopEigenvectors = (A, clusterStyle, numberOfClusters) => {
    switch (clusterStyle) {
        case "adjacency":
            return adjacencySpectralEmbedding(A, numberOfClusters);
        case "laplacian":
            return laplacianSpectralEmbedding(A, numberOfClusters, normalized = false);
        case "normLaplacian":
            return laplacianSpectralEmbedding(A, numberOfClusters, normalized = true);
        default:
            console.error(`Unrecognized clustering style: ${clusterStyle} !`)
    }
}

const getClusterAssignments = (A, clusterStyle, numberOfClusters) => {
    const actualClusters = Math.min(A.size()[0], numberOfClusters);

    if (A.size()[0] <= 2) { // Will always partition each of two nodes into its own community
        return {
            clusterAssignments: clusterColors.slice(0, 2),
            topEigenvectors: [[1, 0], [0, 1]]
        }
    }

    const pertinentEigenVectors = getTopEigenvectors(A, clusterStyle, actualClusters);
    const kmeans = new skmeans(pertinentEigenVectors, actualClusters);
    return {
        kmeans,
        clusterAssignments: getConsistentClusters(kmeans.idxs),
        topEigenvectors: pertinentEigenVectors
    }
}

const getStartingInfoFor = (matrix) => {
    const nodes = matrix.map((_, i) => ({ id: i, index: i }))
    const links = matrix.flatMap((row, i) =>
        row.map((element, j) => {
            if (j >= i || matrix[i][j] == 0) {
                return;
            }
            return {
                source: i,
                target: j,
            }
        }).filter(d => d)
    )

    return { nodes, links, adjacency: math.sparse(matrix), trueCommunities: [] };
}

const sampleSBM = (communitySizes, probabilityMatrix) => {
    let id = -1; // Start at -1 to do 0 indexing
    const nodes = communitySizes.flatMap((communitySize, community) =>
        [...Array(communitySize).keys()].map(_ => {
            id++;
            return {
                id,
                community
            };
        })
    );

    const links = nodes.flatMap(incomingNode =>
        nodes.map(outcomingNode => {
            if (incomingNode.id >= outcomingNode.id) { // Only do one side of edge
                return;
            }
            if (Math.random() < probabilityMatrix[incomingNode.community][outcomingNode.community]) {
                return {
                    source: incomingNode.id,
                    target: outcomingNode.id,
                    probabilityMatrix: probabilityMatrix[incomingNode.community][outcomingNode.community],
                }
            }
        })
    ).filter(link => link); // remove undefined

    const N = nodes.length;
    const adjacency = math.sparse()
    adjacency.resize([N, N])
    for (const link of links) {
        adjacency.set([link.source, link.target], 1)
        adjacency.set([link.target, link.source], 1)
    }
    const trueCommunities = communitySizes.flatMap((size, index) => new Array(size).fill(index))

    return { nodes, links, adjacency, trueCommunities };
}

const calculateBoundary = (point1, point2) => {
    const slope = (point2[1] - point1[1]) / (point2[0] - point1[0]);
    const perpendicularSlope = -1 / slope
    const midpoint = [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
    let x1, x2, y1, y2;
    if (Math.abs(point2[1] - point1[1]) < 1e-15) { // Vertical boundary
        x1 = midpoint[0];
        y1 = -1;
        x2 = midpoint[0];
        y2 = 1;
    } else if (Math.abs(slope) === Infinity) { // Horizontal boundary
        x1 = -1;
        y1 = midpoint[1];
        x2 = 1;
        y2 = midpoint[1];
    } else {
        x1 = (-1 + perpendicularSlope * midpoint[0] - midpoint[1]) / perpendicularSlope
        y1 = -1;
        x2 = (1 + perpendicularSlope * midpoint[0] - midpoint[1]) / perpendicularSlope
        y2 = 1
    }
    return {
        x1, y1,
        x2, y2
    };
}

const showTooltipWith = function (element, text) {
    tooltip.text(text);
    const rect = element.getBoundingClientRect();
    tooltip.style("top", `${d3.event.pageY - 2 * rect.height}px`)
    tooltip.style("left", `${d3.event.pageX - rect.width / 2}px`)
}

const hideTooltip = () =>
    tooltip.style("top", "-1000px")

const drag = simulation => {
    function dragstarted(d) {
        if (simulation.alpha() === -1) return;
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

class StartingGraphView {
    constructor(intoElement, startingGraph = {}, controls = STANDARD_CONTROLS, startingStyle = 0) {
        this.intoElement = intoElement;
        this.width = undefined;
        this.height = undefined;

        // Graph info
        this.nodes = startingGraph.nodes || [];
        this.links = startingGraph.links || [];
        this.adjacency = startingGraph.adjacency || math.sparse();
        this.trueCommunities = startingGraph.trueCommunities || [];

        // Rendering details
        this.controls = controls;
        this.currentClusterNum = 2;
        this.currentClusterStyleIndex = startingStyle !== undefined ? startingStyle : 0;
        this.mouse = null;
        this.spectralLayout = false;
        this.spawnable = controls.includes("spawn")
    }

    onWindowResize() {
        if (this.width) {
            this.width = d3.select(this.intoElement).node().getBoundingClientRect().width;
            this.height = this.width;
            this.svg
                .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
        }
    }

    initializeOntoDOM(empty = false) {
        this.width = d3.select(this.intoElement).node().getBoundingClientRect().width;
        this.height = this.width;
        window.addEventListener("resize", this.onWindowResize);

        const viewInstance = this;

        // Add graph layout ability
        this.simulation = d3.forceSimulation(this.nodes)
            .force("charge", d3.forceManyBody().strength(-120))
            .force("link", d3.forceLink(this.links))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .on("tick", this.ticked.bind(this)); // ensure `this` is the class inside ticked

        this.dragger = drag(this.simulation)


        this.svg = d3.select(this.intoElement)
            .append("svg")
            .attr("viewBox",
                [-this.width / 2,
                -this.height / 2,
                this.width,
                this.height])
            .attr("cursor", "crosshair")

        if (this.spawnable) {
            this.dragger
                .on("start.mouse", function () {
                    viewInstance.mouseleft(this);
                })
                .on("end.mouse", function () {
                    viewInstance.mousemoved(this)
                })

            this.svg
                .on("mouseleave", this.mouseleft.bind(this))
                .on("mousemove", function () {
                    viewInstance.mousemoved(this)
                })
                .on("click", function () {
                    viewInstance.clicked(this)
                });

            // Add mouse interactivity
            this.mouselink = this.svg.append("g")
                .attr("stroke", "red")
                .selectAll("line");

            this.cursor = this.svg.append("circle")
                .attr("display", "none")
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("r", mindistance - 5);
        }


        this.link = this.svg.append("g")
            .attr("stroke", "#999")
            .selectAll("line");

        this.node = this.svg.append("g")
            .selectAll("circle");

        // Add spectral layout clustering info
        this.centroidPlot = this.svg.append("g")
            .attr("id", "centroids")
            .selectAll("circle");

        this.boundary = this.svg.append("line")
            .attr("stroke", "black")

        this.addControls();

        this.refitGraph();
        this.rerenderGraph();

        if (this.nodes.length === 0 && !empty) { // If no nodes and graph was not indicated to start empty, add a single node
            this.spawn({ x: 0, y: 0 })
        }

        this.onWindowResize();
    }

    addControls() {
        if (this.controls.length == 0) {
            return;
        }

        this.uiHolder = d3.select(this.intoElement)
            .append("div")
            .attr("class", "view-controls")

        if (this.controls.includes("embedding")) {
            const changeStyleControls = this.uiHolder.append("div")
                .on("mousemove", function () {
                    showTooltipWith(this, "Type of Spectral Embedding")
                })
                .on("mouseleave", hideTooltip);

            changeStyleControls.append("i")
                .attr("class", "fas fa-chevron-circle-left")
                .on("click", this.prevClusterStyle.bind(this));

            changeStyleControls.append("i")
                .attr("class", "fas fa-chevron-circle-right")
                .on("click", this.nextClusterStyle.bind(this));

            this.clusterStyleLabel = changeStyleControls.append("span")
        }

        if (this.controls.includes("clusterNum")) {
            const changeClusterNumControls = this.uiHolder.append("div")
                .on("mousemove", function () {
                    showTooltipWith(this, "Number of Clusters to Fit")
                })
                .on("mouseleave", hideTooltip);

            changeClusterNumControls.append("i")
                .attr("class", "fas fa-arrow-down")
                .on("click", this.downClusterNum.bind(this));

            changeClusterNumControls.append("i")
                .attr("class", "fas fa-arrow-up")
                .on("click", this.upClusterNum.bind(this));

            this.numClustersLabel = changeClusterNumControls.append("span")

        }

        if (this.controls.includes("reset")) {
            this.uiHolder.append("i")
                .attr("class", "fas fa-trash")
                .on("click", this.resetGraph.bind(this))
                .on("mousemove", function () {
                    showTooltipWith(this, "Reset Graph")
                })
                .on("mouseleave", hideTooltip);
        }

        if (this.controls.includes("refit")) {
            this.uiHolder.append("i")
                .attr("class", "fas fa-retweet")
                .on("click", () => { this.refitGraph(true); this.rerenderGraph() })
                .on("mousemove", function () {
                    showTooltipWith(this, "Refit Clusters")
                })
                .on("mouseleave", hideTooltip);
        }

        if (this.controls.includes("showTruth")) {
            this.uiHolder.append("i")
                .attr("class", "fas fa-search")
                .on("click", this.showTrueCommunities.bind(this))
                .on("mousemove", function () {
                    showTooltipWith(this, "Show given communities")
                })
                .on("mouseleave", hideTooltip);

            const colorBar = this.uiHolder.append("div").attr("class", "color-bar");
            const numTrue = new Set(this.trueCommunities).size;
            this.activeCommunities = new Array(numTrue).fill(false);
            for (let i = 0; i < numTrue; i++) {
                colorBar.append("div")
                    .style("background", trueClusterColors[i])
                    .style("opacity", 0.2)
                    .on("click", () => this.toggleCommunity(i))
                    .on("mousemove", function () {
                        showTooltipWith(this, `Show ${ordinalSuffixOf(i + 1)} community`)
                    })
                    .on("mouseleave", hideTooltip);
            }
        }

        if (this.controls.includes("spectral")) {
            this.uiHolder.append("i")
                .attr("class", "fas fa-binoculars")
                .on("click", this.toggleSpectralLayout.bind(this))
                .on("mousemove", function () {
                    showTooltipWith(this, "Switch to/from Spectral Layout")
                })
                .on("mouseleave", hideTooltip);
        }

        this.updateLabels();
    }

    generateNew() {

    }
    updateLabels() {
        if (this.clusterStyleLabel) this.clusterStyleLabel.text(clusterStyles[this.currentClusterStyleIndex]);
        if (this.numClustersLabel) this.numClustersLabel.text(`${this.currentClusterNum} Clusters`)
    }

    upClusterNum() {
        this.currentClusterNum = this.currentClusterNum >= this.nodes.length ?
            this.nodes.length : this.currentClusterNum + 1;
        this.refitGraph();
        this.rerenderGraph();
        this.updateLabels();
    }

    downClusterNum() {
        this.currentClusterNum = this.currentClusterNum <= 2 ?
            2 : this.currentClusterNum - 1;
        this.refitGraph();
        this.rerenderGraph();
        this.updateLabels();
    }

    nextClusterStyle() {
        this.currentClusterStyleIndex = this.currentClusterStyleIndex === clusterStyles.length - 1 ?
            0 : this.currentClusterStyleIndex + 1;
        this.refitGraph();
        this.rerenderGraph();
        this.updateLabels();
    }

    prevClusterStyle() {
        this.currentClusterStyleIndex = this.currentClusterStyleIndex === 0 ?
            clusterStyles.length - 1 : this.currentClusterStyleIndex - 1;
        this.refitGraph();
        this.rerenderGraph();
        this.updateLabels();
    }

    resetGraph() {
        this.links.length = 0
        this.nodes.length = 0
        this.adjacency.resize([0, 0])
        this.currentClusterNum = 2
        this.updateLabels();
        if (this.spectralLayout) {
            this.toggleSpectralLayout()
        }
        this.spawn({ x: 0, y: 0 });
    }

    refitGraph(useCache = false) { // TODO Add more cacheing here
        const availableColors = getAvailableColors(this.numberOfClusters)
        if (this.topEigenvectors && useCache) {
            this.kmeans = new skmeans(this.topEigenvectors, this.currentClusterNum);
            this.clusterAssignments = getConsistentClusters(this.kmeans.idxs);
        } else {
            const clusteringInfo = getClusterAssignments(this.adjacency,
                clusterStyles[this.currentClusterStyleIndex],
                this.currentClusterNum);
            this.clusterAssignments = clusteringInfo.clusterAssignments;
            this.kmeans = clusteringInfo.kmeans
            this.topEigenvectors = clusteringInfo.topEigenvectors;
        }
        this.nodeColors = this.clusterAssignments.map(cluster => availableColors[cluster]);
    }

    showTrueCommunities() {
        this.activeCommunities.fill(!this.activeCommunities.includes(true))

        this.showActiveCommunities();
    }

    toggleCommunity(community) {
        this.activeCommunities[community] = !this.activeCommunities[community]
        this.showActiveCommunities();
    }

    showActiveCommunities() {
        const isActive = i => this.activeCommunities[this.trueCommunities[i]];
        const noneActive = !(this.activeCommunities.includes(true)); // isActive not always false
        this.node.transition(graphTransition)
            .attr("fill", (_, i) =>
                isActive(i) ? trueClusterColors[this.trueCommunities[i]] : this.nodeColors[i])
            .attr("opacity", (_, i) => isActive(i) || noneActive ? nodeOpacity : 0.2);

        d3.selectAll(`${this.intoElement} .color-bar > div`)
            .transition(graphTransition)
            .style("opacity", (_, i) =>
                this.activeCommunities[i] ? "1" : "0.5"
            )

        d3.select(`${this.intoElement} .fa-search`)
            .classed("active-control", !noneActive)
    }

    toggleSpectralLayout() {
        if (this.spectralLayout) { // turn it off
            this.spectralLayout = false;
            this.simulation.nodes(this.nodes);
            this.simulation.force("link").links(this.links);
            this.simulation.alpha(1).restart();
        } else {
            this.simulation.stop()
            this.simulation.alpha(-1); // Gives dragger ability to be disabled
            this.spectralLayout = true;
        }

        this.rerenderGraph();

        d3.select(`${this.intoElement} .fa-binoculars`)
            .classed("active-control", this.spectralLayout)
    }

    ticked() {
        this.node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)

        this.link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }

    mouseleft() {
        this.mouse = null;
        this.cursor.attr("display", "none")
        this.mouselink.attr("display", "none")
    }

    mousemoved(on) {
        const [x, y] = d3.mouse(on);
        this.mouse = { x, y };
        this.cursor
            .attr("display", this.mouse ? null : "none")
            .attr("cx", this.mouse && this.mouse.x)
            .attr("cy", this.mouse && this.mouse.y);

        this.mouselink = this.mouselink
            .data(this.mouse ? this.nodes.filter(node => inrange(this.mouse, node)) : [])
            .join("line")
            .attr("x1", this.mouse && this.mouse.x)
            .attr("y1", this.mouse && this.mouse.y)
            .attr("x2", d => d.x)
            .attr("y2", d => d.y);
    }

    clicked(on) {
        this.mousemoved(on);
        this.spawn({ x: this.mouse.x, y: this.mouse.y, index: this.nodes.length - 1 });
        this.mousemoved(on);
    }

    spawn(source) {
        this.nodes.push(source);
        this.adjacency.resize([this.nodes.length, this.nodes.length])

        for (const target of this.nodes) {
            if (inrange(source, target) && (source !== target)) {
                this.links.push({ source, target });
                this.adjacency.set([this.nodes.length - 1, target.index], 1)
                this.adjacency.set([target.index, this.nodes.length - 1], 1)
            }
        }

        this.refitGraph();
        this.rerenderGraph();

        this.simulation.nodes(this.nodes);
        this.simulation.force("link").links(this.links);

        if (!this.spectralLayout) {
            this.simulation.alpha(1).restart();
        }
    }

    rerenderGraph() {
        if (this.spectralLayout) {
            this.spectralRender();
        } else {
            this.forceRender();
        }

        if (this.activeCommunities !== undefined) {
            this.showActiveCommunities()
        }
    }

    spectralRender() {
        const positions = this.topEigenvectors.map(row => row.slice(0, 2))
        const xCoords = positions.map(coord => coord[0])
        const yCoords = positions.map(coord => coord[1])

        const xScale = d3.scaleLinear()
            .range([-this.width / 2 + nodeRadius, this.width / 2 - nodeRadius])
            .domain([Math.min(...xCoords), Math.max(...xCoords)])

        const yScale = d3.scaleLinear()
            .range([-this.height / 2 + nodeRadius, this.height / 2 - nodeRadius])
            .domain([Math.min(...yCoords), Math.max(...yCoords)])

        if (this.currentClusterNum === 2 && this.nodes.length > 2) {
            this.drawCentroids(xScale, yScale);
        } else {
            this.removeCentroids();
        }

        this.nodes.forEach((node, i) => {
            node.x = xScale(positions[i][0]);
            node.y = yScale(positions[i][1])
        })

        const changeLinkPosition = caller =>
            caller.transition(graphTransition)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

        const changeNodePosition = caller =>
            caller.transition(graphTransition)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

        this.link = this.link
            .data(this.links)
            .join(enter => enter.append("line")
                .call(changeLinkPosition),
                changeLinkPosition,
                exit => exit.remove())
            .attr("opacity", 0.2);

        this.node = this.node
            .data(this.nodes)
            .join(
                enter => enter.append("circle")
                    .call(enter => changeNodePosition(enter)
                        .attr("fill", this.nodeColors[this.nodes.length - 1])
                        .attr("r", nodeRadius)
                        .attr("opacity", nodeOpacity)
                    ),
                update => changeNodePosition(update)
                    .attr("fill", d => this.nodeColors[d.index]),
                exit => exit.remove()
            );
    }

    forceRender() {
        this.removeCentroids();

        this.link = this.link
            .data(this.links)
            .join("line")
            .attr("opacity", nodeOpacity);

        this.node = this.node
            .data(this.nodes)
            .join(
                enter => enter.append("circle")
                    .call(enter => enter
                        .attr("fill", this.nodeColors[this.nodes.length - 1])
                        .attr("r", nodeRadius)
                        .attr("opacity", nodeOpacity)
                    ).call(this.dragger),
                update => update.transition(graphTransition)
                    .attr("fill", d => this.nodeColors[d.index]),
                exit => exit.remove()
            );
    }

    drawCentroids(xScale, yScale) {
        // Render cluster boundaries
        const updateCentroids = caller =>
            caller.transition(graphTransition)
                .attr("cx", d => xScale(d[0]))
                .attr("cy", d => yScale(d[1]))
                .attr("r", 10)
                .attr("stroke", "#000")
                .attr("stroke-width", 2)
                .attr("fill", "#333")
                .attr("opacity", "0.2")

        this.centroidPlot = this.centroidPlot
            .attr("display", null)
            .data(this.kmeans.centroids)
            .join(enter => enter.append("circle")
                .call(updateCentroids),
                updateCentroids,
                exit => exit.remove()
            )

        const boundary = calculateBoundary(this.kmeans.centroids[0], this.kmeans.centroids[1], this.width, this.height)

        this.boundary.attr("display", null)
            .transition(graphTransition)
            .attr("stroke-width", 3.5)
            .attr("opacity", "0.4")
            .attr("x1", xScale(boundary.x1))
            .attr("x2", xScale(boundary.x2))
            .attr("y1", yScale(boundary.y1))
            .attr("y2", yScale(boundary.y2))
    }

    removeCentroids() {
        this.centroidPlot.attr("display", "none")
        this.boundary.attr("display", "none")
    }
}

class GeneratingGraphView extends StartingGraphView {
    constructor(intoElement, generator, controls = STANDARD_CONTROLS) {
        super(intoElement, {}, controls)

        this.generator = generator;
    }

    initializeOntoDOM() {
        this.generateNew(false)

        super.initializeOntoDOM()
    }

    addControls() {
        super.addControls();
        if (this.controls.includes("generate")) {
            this.uiHolder.append("i")
                .attr("class", "fas fa-undo")
                .on("click", this.generateNew.bind(this))
                .on("mousemove", function () {
                    showTooltipWith(this, "Generate Graph")
                })
                .on("mouseleave", hideTooltip);
        }
    }

    generateNew(rerender = true) {
        const startingGraph = this.generator();
        this.nodes = startingGraph.nodes || [];
        this.links = startingGraph.links || [];
        this.adjacency = startingGraph.adjacency || math.sparse();
        this.trueCommunities = startingGraph.trueCommunities || [];
        if (rerender) {
            this.simulation.nodes(this.nodes);
            this.simulation.force("link").links(this.links);
            this.refitGraph()
            this.rerenderGraph()

            if (!this.spectralLayout) {
                this.simulation.alpha(1).restart();
            }
        }
    }
}
