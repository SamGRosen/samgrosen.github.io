// Constants
const mindistance = 40;
const inrange = ({ x: sx, y: sy }, { x: tx, y: ty }) => Math.hypot(sx - tx, sy - ty) <= mindistance;
const clusterStyles = ["adjacency", "laplacian", "normLaplacian", "cosineSimilarity"];
const nodeRadius = 5;
const durationTime = 500;

const clusterColors = d3.schemeTableau10.slice();
clusterColors.push(...d3.schemeSet2);
clusterColors.push(...d3.schemeSet3);

const tooltip = d3.select("body")
    .append("div")
    .attr("id", "control-tooltip")

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
    const topScaledEigenValues = eigendecomp.values.toArray().slice(numComponents, numComponents + numberOfClusters).map(e => math.sqrt(math.abs(e)))
    const topEigenvectors = math.subset(eigendecomp.vectors,
        math.index(
            math.range(0, adjMatrix.size()[0]),
            math.range(numComponents, numComponents + numberOfClusters) // Laplacian based methods use first k non-trivial eigenvectors
        ))

    return topEigenvectors._data;
}

const getTopEigenvectors = (A, clusterStyle, numberOfClusters) => {
    switch (clusterStyle) {
        case "cosineSimilarity": // falls through to adjacency case
            return adjacencySpectralEmbedding(math.multiply(A, math.transpose(A)), numberOfClusters);
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
    const availableColors = getAvailableColors(numberOfClusters)
    const actualClusters = Math.min(A.size()[0], numberOfClusters);

    if (A.size()[0] <= 2) { // Will always partition each of two nodes into its own community
        return {
            clusterAssignments: availableColors.slice(0, 2),
            topEigenvectors: [[1, 0], [0, 1]]
        }
    }

    const pertinentEigenVectors = getTopEigenvectors(A, clusterStyle, actualClusters);
    const kmeans = new skmeans(pertinentEigenVectors, actualClusters);
    return {
        kmeans,
        clusterAssignments: getConsistentClusters(kmeans.idxs).map(cluster => availableColors[cluster]),
        topEigenvectors: pertinentEigenVectors
    }
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
    if (Math.abs(slope) < 1e-10) { // Vertical boundary
        x1 = -1
        y1 = midpoint[1];
        x2 = 1
        y2 = midpoint[1];
    } else if (slope === Infinity) { // Horizontal boundary
        x1 = midpoint[0];
        y1 = -1
        x2 = midpoint[0];
        y2 = 1
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
    tooltip.style("left", `${d3.event.pageX - rect.width}px`)
}

const hideTooltip = () =>
    tooltip.style("top", "-1000px")

class GraphView {
    constructor(intoElement, startingGraph = {}) {
        this.intoElement = intoElement;
        this.width = undefined;
        this.height = undefined;

        // Graph info
        this.nodes = startingGraph.nodes || [];
        this.links = startingGraph.links || [];
        this.adjacency = startingGraph.adjacency || math.sparse();
        this.trueCommunities = startingGraph.trueCommunities || [];

        // Rendering details
        this.currentClusterNum = 2
        this.currentClusterStyleIndex = 0;
        this.mouse = null;
        this.spectralLayout = false;
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
            .force("charge", d3.forceManyBody().strength(-60))
            .force("link", d3.forceLink(this.links))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .on("tick", this.ticked.bind(this)); // ensure `this` is the class inside ticked

        this.svg = d3.select(this.intoElement)
            .append("svg")
            .attr("viewBox",
                [-this.width / 2 - nodeRadius,
                -this.height / 2 - nodeRadius,
                this.width + 2 * nodeRadius,
                this.height + 2 * nodeRadius])
            .attr("cursor", "crosshair")
            .on("mouseleave", this.mouseleft.bind(this))
            .on("mousemove", function () {
                viewInstance.mousemoved(this)
            })
            .on("click", function () {
                viewInstance.clicked(this)
            });

        this.link = this.svg.append("g")
            .attr("stroke", "#999")
            .selectAll("line");

        this.node = this.svg.append("g")
            .selectAll("circle");

        // Add mouse interactivity
        this.mouselink = this.svg.append("g")
            .attr("stroke", "red")
            .selectAll("line");

        this.cursor = this.svg.append("circle")
            .attr("display", "none")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("r", mindistance - 5);

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
    }

    addControls() {
        this.uiHolder = d3.select(this.intoElement)
            .append("div")
            .attr("class", "view-controls")

        const changeStyleControls = this.uiHolder.append("div")
            .on("mousemove", function () {
                showTooltipWith(this, "Type of Spectral Embedding")
            })
            .on("mouseleave", hideTooltip);

        changeStyleControls.append("i")
            .attr("class", "fas fa-chevron-circle-left")
            .on("click", this.prevClusterStyle.bind(this));

        this.clusterStyleLabel = changeStyleControls.append("span")

        changeStyleControls.append("i")
            .attr("class", "fas fa-chevron-circle-right")
            .on("click", this.nextClusterStyle.bind(this));

        const changeClusterNumControls = this.uiHolder.append("div")
            .on("mousemove", function () {
                showTooltipWith(this, "Number of Clusters to Fit")
            })
            .on("mouseleave", hideTooltip);

        changeClusterNumControls.append("i")
            .attr("class", "fas fa-arrow-down")
            .on("click", this.downClusterNum.bind(this));

        this.numClustersLabel = changeClusterNumControls.append("span")

        changeClusterNumControls.append("i")
            .attr("class", "fas fa-arrow-up")
            .on("click", this.upClusterNum.bind(this));

        this.uiHolder.append("i")
            .attr("class", "fas fa-trash")
            .on("click", this.resetGraph.bind(this))
            .on("mousemove", function () {
                showTooltipWith(this, "Reset Graph")
            })
            .on("mouseleave", hideTooltip);

        this.uiHolder.append("i")
            .attr("class", "fas fa-retweet")
            .on("click", () => { this.refitGraph(true); this.rerenderGraph() })
            .on("mousemove", function () {
                showTooltipWith(this, "Fit Clusters")
            })
            .on("mouseleave", hideTooltip);

        // this.uiHolder.append("button")
        //     .text("true communities (remove)")
        //     .on("click", this.showTrueCommunities.bind(this));

        this.uiHolder.append("i")
            .attr("class", "fas fa-binoculars")
            .on("click", this.toggleSpectralLayout.bind(this))
            .on("mousemove", function () {
                showTooltipWith(this, "Switch to/from Spectral Layout")
            })
            .on("mouseleave", hideTooltip);

        this.updateLabels();
    }

    updateLabels() {
        this.clusterStyleLabel.text(clusterStyles[this.currentClusterStyleIndex]);
        this.numClustersLabel.text(`${this.currentClusterNum} Clusters`)
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
        if (this.topEigenvectors && useCache) {
            const availableColors = getAvailableColors()
            this.kmeans = new skmeans(this.topEigenvectors, this.currentClusterNum);
            this.clusterAssignments = getConsistentClusters(this.kmeans.idxs).map(cluster => availableColors[cluster]);
        } else {
            const clusteringInfo = getClusterAssignments(this.adjacency,
                clusterStyles[this.currentClusterStyleIndex],
                this.currentClusterNum);
            this.clusterAssignments = clusteringInfo.clusterAssignments;
            this.kmeans = clusteringInfo.kmeans
            this.topEigenvectors = clusteringInfo.topEigenvectors;
        }
    }

    showTrueCommunities() { // needs to be toggable
        this.node.transition().duration(durationTime)
            .attr("fill", (_, i) => {
                return i >= this.trueCommunities.length ? "black" :
                    clusterColors[this.trueCommunities[i]];
            })
            .attr("opacity", (_, i) => {
                return i >= this.trueCommunities.length ? "0.2" :
                    "1";
            })
    }

    toggleSpectralLayout() {
        if (this.spectralLayout) { // turn it off
            this.spectralLayout = false;
            this.simulation.nodes(this.nodes);
            this.simulation.force("link").links(this.links);
            this.simulation.alpha(1).restart();
        } else {
            this.simulation.stop()
            this.spectralLayout = true;
        }

        this.rerenderGraph();

        d3.select(`${this.intoElement} .fa-binoculars`)
            .style("color", this.spectralLayout ? "#4682b4" : null)
    }

    ticked() {
        this.node.attr("cx", d => d.x)
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

        if (!this.spectralLayout) {
            this.simulation.nodes(this.nodes);
            this.simulation.force("link").links(this.links);
            this.simulation.alpha(1).restart();
        }
    }

    rerenderGraph() {
        if (this.spectralLayout) {
            this.spectralRender();
        } else {
            this.forceRender();
        }
    }

    spectralRender() {
        const positions = this.topEigenvectors.map(row => row.slice(0, 2))
        const xCoords = positions.map(coord => coord[0])
        const yCoords = positions.map(coord => coord[1])

        const xScale = d3.scaleLinear()
            .range([-this.width / 2, this.width / 2])
            .domain([Math.min(...xCoords), Math.max(...xCoords)])

        const yScale = d3.scaleLinear()
            .range([-this.height / 2, this.height / 2])
            .domain([Math.min(...yCoords), Math.max(...yCoords)])

        if (this.currentClusterNum === 2) {
            this.drawCentroids(xScale, yScale);
        } else {
            this.removeCentroids();
        }

        this.nodes.forEach((node, i) => {
            node.x = xScale(positions[i][0]);
            node.y = yScale(positions[i][1])
        })

        this.link = this.link
            .data(this.links)
            .join(enter => enter.append("line").call(enter => enter.transition().duration(durationTime)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
            ),
                update => update.transition().duration(durationTime)
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y),
                exit => exit.remove())
            .attr("opacity", 0.1);

        this.node = this.node
            .data(this.nodes)
            .join(
                enter => enter.append("circle")
                    .call(enter => enter.transition().duration(durationTime)
                        .attr("r", 5)
                        .attr("fill", this.clusterAssignments[this.nodes.length - 1])
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                    ),
                update => update.transition().duration(durationTime)
                    .attr("fill", d => this.clusterAssignments[d.index])
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y),
                exit => exit.remove()
            );
    }

    forceRender() {
        this.removeCentroids();

        this.link = this.link
            .data(this.links)
            .join("line")
            .attr("opacity", 1.0);

        this.node = this.node
            .data(this.nodes)
            .join(
                enter => enter.append("circle")
                    .call(enter => enter
                        .attr("r", 5)
                        .attr("fill", this.clusterAssignments[this.nodes.length - 1])
                    ),
                update => update.transition().duration(durationTime)
                    .attr("fill", d => this.clusterAssignments[d.index]),
                exit => exit.remove()
            );
    }

    drawCentroids(xScale, yScale) {
        // Render cluster boundaries
        if (this.kmeans === undefined) {
            return
        }

        this.centroidPlot = this.centroidPlot
            .attr("display", null)
            .data(this.kmeans.centroids)
            .join(enter => enter.append("circle")
                .call(enter => enter
                    .attr("cx", d => xScale(d[0]))
                    .attr("cy", d => yScale(d[1]))
                    .attr("r", 10)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2)
                    .attr("fill", "#333")
                    .attr("opacity", "0.2")
                ),
                update => update.transition().duration(durationTime)
                    .attr("cx", d => xScale(d[0]))
                    .attr("cy", d => yScale(d[1])),
                exit => exit.remove()
            )

        const boundary = calculateBoundary(this.kmeans.centroids[0], this.kmeans.centroids[1], this.width, this.height)

        this.boundary.attr("display", null)
            .transition().duration(durationTime)
            .attr("x1", xScale(boundary.x1))
            .attr("x2", xScale(boundary.x2))
            .attr("y1", yScale(boundary.y1))
            .attr("y2", yScale(boundary.y2))
    }

    removeCentroids() {
        this.centroidPlot.attr("display", "none")
        this.boundary
            .attr("display", "none")
    }
}


const view = new GraphView("#graph-one",
    sampleSBM([20, 20, 20, 20],
        [[.02, .044, .002, .009],
        [.044, .115, .01, .042],
        [.002, .01, .02, .045],
        [.009, .042, .045, .117],
        ]))

view.initializeOntoDOM()

const view2 = new GraphView("#graph-two")

view2.initializeOntoDOM()