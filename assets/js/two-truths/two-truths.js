// Constants
const mindistance = 40;
const inrange = ({ x: sx, y: sy }, { x: tx, y: ty }) => Math.hypot(sx - tx, sy - ty) <= mindistance;
const clusterStyles = ["adjacency", "laplacian", "normLaplacian", "cosineSimilarity"];
const height = 500 // remove to make dynamic;
const width = height

const clusterColors = d3.schemeTableau10.slice();
clusterColors.push(...d3.schemeSet2);
clusterColors.push(...d3.schemeSet3);

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
    for(const assignment of possibleAssignments) {
        firstIndexWithAssignment.set(assignment, clusterAssignments.indexOf(assignment))
    }
    const mappedToFirstIndex = clusterAssignments.map(d => firstIndexWithAssignment.get(d))
    const possibleIndices = [...new Set(firstIndexWithAssignment.values())]
    possibleIndices.sort((a,b) => a - b);
    const mappedBackToOriginalIndexSpace = new Map();
    possibleIndices.forEach((firstIndex, newIndex) => mappedBackToOriginalIndexSpace.set(firstIndex, newIndex))
    
    return mappedToFirstIndex.map(d => mappedBackToOriginalIndexSpace.get(d))
}

const adjacencySpectralEmbedding = (adjMatrix, numberOfClusters, scaled=true) => {
    /* 
        The referenced paper wants scaled eigenvectors returned but it really does not matter since its
        just a transformation of the axis in the lower-dimensional space. The only potential difference
        is a more well-behaved set for the kmeans algorithm.
    */
    const eigendecomp = math.eigs(adjMatrix)
    const eigenValues = eigendecomp.values.toArray();
    const copiedEigenValues = eigenValues.slice();
    const topEigenValues = copiedEigenValues.sort((a,b) => Math.abs(b) - Math.abs(a)).slice(0, numberOfClusters);
    const indicesOfTopEValues = topEigenValues.map(eValue => eigenValues.indexOf(eValue));

    const topEigenvectors = math.subset(eigendecomp.vectors,
        math.index(
            math.range(0, adjMatrix.size()[0]), 
            indicesOfTopEValues
            )
        );

    const toReturn = scaled ? math.multiply(topEigenvectors, math.diag(topEigenValues.map(e => math.sqrt(math.abs(e))))) : topEigenvectors
    return toReturn._data;
}

const laplacianSpectralEmbedding = (adjMatrix, numberOfClusters, normalized=true, scaled=false) => {
    console.log(adjMatrix)
    const degree_vector = math.multiply(adjMatrix, math.ones(adjMatrix.size()[0]))
    const degree_matrix = math.diag(degree_vector, "sparse")
    const laplacianMatrix = math.subtract(degree_matrix, adjMatrix);
    // Assumes one connected component
    let matrix_to_eigen = laplacianMatrix;
    if(normalized) {
        const invsqrtDegree_matrix = math.diag(
            degree_vector.map(d => d !== 0 ? 1 / math.sqrt(d) : 0))
        matrix_to_eigen = math.multiply(math.multiply(invsqrtDegree_matrix, laplacianMatrix), invsqrtDegree_matrix)
    }
    console.log(matrix_to_eigen)
    const eigendecomp = math.eigs(matrix_to_eigen)
    const numComponents = eigendecomp.values.toArray().filter(e => e < 1e-10).length
    console.log(eigendecomp)
    const topScaledEigenValues = eigendecomp.values.toArray().slice(numComponents, numComponents + numberOfClusters).map(e => math.sqrt(math.abs(e)))
    const topEigenvectors = math.subset(eigendecomp.vectors,
            math.index(
                math.range(0, adjMatrix.size()[0]),
                math.range(numComponents, numComponents + numberOfClusters) // Laplacian based methods use first k non-trivial eigenvectors
            ))

    const toReturn = scaled ? math.multiply(topEigenvectors, topScaledEigenValues) : topEigenvectors;
    return toReturn._data;

}

const getClusterAssignments = (A, clusterStyle, numberOfClusters) => {
    const availableColors = getAvailableColors(numberOfClusters)
    if (A.length <= 2) { // Will always partition each of two nodes into its own community
        return availableColors.slice(1);
    }

    let adj_as_matrix = math.matrix(A);
    const actualClusters = Math.min(A.length, numberOfClusters);
    let pertinentEigenVectors;
    switch(clusterStyle) {
        case "cosineSimilarity": // falls through to adjacency case
            adj_as_matrix = math.multiply(adj_as_matrix, math.transpose(adj_as_matrix));
        case "adjacency":
            pertinentEigenVectors = adjacencySpectralEmbedding(adj_as_matrix, actualClusters);
            break;
        case "laplacian":
            pertinentEigenVectors = laplacianSpectralEmbedding(adj_as_matrix, actualClusters, normalized=false);
            break;
        case "normLaplacian":
            pertinentEigenVectors = laplacianSpectralEmbedding(adj_as_matrix, actualClusters, normalized=true);
            break;
        default:
            console.error(`Unrecognized clustering style: ${clusterStyle} !`)
    }
    // Calculate clusters
    console.log(pertinentEigenVectors)
    // initialize model
    // var gmm = new GMM({
    //     weights: [0.5, 0.5],
    //     means: [[1, 0], [0, 1]],
    //     covariances: [
    //         [[1,0],[0,1]],
    //         [[1,0],[0,1]]
    //     ]
    // });

    // // create some data points


    // // add data points to the model
    // pertinentEigenVectors.forEach(p => gmm.addPoint(p));

    // // run 5 iterations of EM algorithm
    // gmm.runEM(20);
    // console.log(gmm)
    // // predict cluster probabilities for point [-5, 25]

    // const clusters = pertinentEigenVectors.map(p => 
    //     gmm.predict(p).reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0))
    // console.log(clusters)
    // pertinentEigenVectors.forEach(p => console.log(gmm.predictNormalize(p)));
    // var prob = gmm.predict([-5, 25]);  // [0.000009438559331418772, 0.000002126123537376676]

    // predict and normalize cluster probabilities for point [-5, 25]
    // var probNorm = gmm.predictNormalize([-5, 25]);  // [0.8161537535012295, 0.18384624649877046]


    const kmeans = new skmeans(pertinentEigenVectors, actualClusters);
    // return getConsistentClusters(clusters).map(cluster => availableColors[cluster]);
    return getConsistentClusters(kmeans.idxs).map(cluster => availableColors[cluster])
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
    const adjacency = [...Array(N).keys()].map( // Can't use fill to avoid aliasing same array
        _ => new Array(N).fill(0)
    )

    for (const link of links) {
        adjacency[link.source][link.target] = 1;
        adjacency[link.target][link.source] = 1;
    }

    const trueCommunities = communitySizes.flatMap((size, index) => new Array(size).fill(index))

    return { nodes, links, adjacency, trueCommunities};
}

const drag = simulation => {
    function dragstarted(d) {
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


const addGraphView = (intoElement, startingInfo = {nodes: [], links: [], adjacency: [], trueCommunities: []}) => {
    const { nodes, links, adjacency, trueCommunities } = startingInfo;
    let currentClusterNum = 2
    let currentClusterStyleIndex = 0;
    let mouse = null;

    // Begin layout info and framework
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-60))
        .force("link", d3.forceLink(links))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .on("tick", ticked);

    const dragger = drag(simulation)
        .on("start.mouse", mouseleft)
        .on("end.mouse", mousemoved);

    const svg = d3.select(intoElement)
        .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("cursor", "crosshair")
        .on("mouseleave", mouseleft)
        .on("mousemove", mousemoved)
        .on("click", clicked);

    let link = svg.append("g")
        .attr("stroke", "#999")
        .selectAll("line");

    let mouselink = svg.append("g")
        .attr("stroke", "red")
        .selectAll("line");

    let node = svg.append("g")
        .selectAll("circle");

    const cursor = svg.append("circle")
        .attr("display", "none")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("r", mindistance - 5);

    function ticked() {
        node.attr("cx", d => d.x)
            .attr("cy", d => d.y)

        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        mouselink = mouselink
            .data(mouse ? nodes.filter(node => inrange(mouse, node)) : [])
            .join("line")
            .attr("x1", mouse && mouse.x)
            .attr("y1", mouse && mouse.y)
            .attr("x2", d => d.x)
            .attr("y2", d => d.y);

        cursor
            .attr("display", mouse ? null : "none")
            .attr("cx", mouse && mouse.x)
            .attr("cy", mouse && mouse.y);
    }

    function mouseleft() {
        mouse = null;
    }

    function mousemoved() {
        const [x, y] = d3.mouse(this);
        mouse = { x, y };
        simulation.alpha(0.3).restart();
    }

    function clicked() {
        mousemoved.call(this);
        spawn({ x: mouse.x, y: mouse.y });
    }

    // Add ui elements
    const uiHolder = d3.select(intoElement)
        .append("div")
        .attr("width", "100%")

    uiHolder.append("button")
        .text("<<")
        .on("click", () => {
            currentClusterStyleIndex = currentClusterStyleIndex === 0 ? 
            clusterStyles.length - 1 : currentClusterStyleIndex - 1;
            updateClusterStyle();
            clusterStyleLabel.text(() => clusterStyles[currentClusterStyleIndex]);
        })

    const clusterStyleLabel = uiHolder.append("span")
        .text(() => clusterStyles[currentClusterStyleIndex])
    uiHolder.append("button")
        .text(">>")
        .on("click", () => {
            currentClusterStyleIndex = currentClusterStyleIndex === clusterStyles.length - 1 ? 
            0 : currentClusterStyleIndex + 1;
            updateClusterStyle();
            clusterStyleLabel.text(() => clusterStyles[currentClusterStyleIndex]);
        });

    uiHolder.append("button")
        .text("down")
        .on("click", () => {
            currentClusterNum = currentClusterNum === 1 ? 
            1 : currentClusterNum - 1;
            updateClusterStyle();
            numClustersLabel.text(currentClusterNum)
        })

    const numClustersLabel = uiHolder.append("span")
        .text(currentClusterNum)

    uiHolder.append("button")
        .text("up")
        .on("click", () => {
            currentClusterNum = currentClusterNum === adjacency.length ? 
            adjacency.length : currentClusterNum + 1;
            updateClusterStyle();
            numClustersLabel.text(currentClusterNum)
        })

    uiHolder.append("button")
        .text("reset")
        .on("click", () => {
            nodes.length = 0
            links.length = 0
            adjacency.length = 0
            currentClusterNum = 2
            updateClusterStyle()
            numClustersLabel.text(currentClusterNum)
            spawn({x: 0, y: 0});
        })
    
    uiHolder.append("button")
        .text("refit")
        .on("click", updateClusterStyle)


    uiHolder.append("button")
        .text("true communities (remove)")
        .on("click", () => {

            node.transition().duration(500)
                .attr("fill", (_, i) => {
                    return i >= trueCommunities.length ? "black" :
                    clusterColors[trueCommunities[i]];
                })
                .attr("opacity", (_, i) => {
                    return i >= trueCommunities.length ? "0.2" :
                    "1";
                })
        });
    // Begin graph clustering details
    function spawn(source) {
        nodes.push(source);

        // Increase dimension of adjacency matrix and degree vector
        adjacency.push(new Array(adjacency.length).fill(0));
        for (const row of adjacency) {
            row.push(0);
        }

        for (const target of nodes) {
            if (inrange(source, target) && (source !== target)) {
                links.push({ source, target });
                adjacency[adjacency.length - 1][target.index] = 1
                adjacency[target.index][adjacency.length - 1] = 1
            }
        }

        updateClusterStyle();
        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
    }

    function updateClusterStyle() {
        const cluster_style_box = document.getElementById("curr-cluster-style");
        if (cluster_style_box) {
            cluster_style_box.innerText = clusterStyles[currentClusterStyleIndex]
        }
        const clusterAssignments = getClusterAssignments(adjacency,
            clusterStyles[currentClusterStyleIndex],
            currentClusterNum);

        link = link
            .data(links)
            .join("line");
        node = node
            .data(nodes)
            .join(
                enter => enter.append("circle").attr("r", 0)
                    .call(enter => enter//.transition().duration(500)
                        .attr("r", 5)
                        .attr("fill", clusterAssignments[nodes.length - 1])
                    )
                    .call(dragger),
                update => update.transition().duration(500)
                    .attr("fill", (d) => clusterAssignments[d.index]),
                exit => exit.remove()
            );
    }
    updateClusterStyle();
    // spawn({ x: 0, y: 0 });
}


addGraphView("#graph-one", 
    sampleSBM([15, 15, 15, 15], 
        [[.02,  .044, .002, .009],
         [.044,   .115, .01, .042],
         [.002, .01, .02, .045],
         [.009, .042, .045, .117],
        ]))

addGraphView("#graph-two", sampleSBM([20, 30], [[.8, .2], [.2, .7]]))

