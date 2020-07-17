const pairToArray = (pair) => {
    const commaIndex = pair.indexOf(",")
    const firstNum = parseInt(pair.slice(1, commaIndex))
    const secondNum = parseInt(pair.slice(commaIndex + 1, pair.length - 1).trim());
    return [firstNum, secondNum];
};

const pairToClass = (pair) => {
    const commaIndex = pair.indexOf(",")
    const firstNum = pair.slice(1, commaIndex)
    const secondNum = pair.slice(commaIndex + 1, pair.length - 1).trim();
    return `c${firstNum}--${secondNum}`
};

function drawPlot(nodes) {
    const defaultNodeOpacity = 0.4;
    const maxAppears = Math.max(...nodes.map(x => x.firstAppears))
    const numStates = nodes.length;
    const numCards = Math.round(2 * Math.sqrt(numStates - 1))
    const visibleNodes = new Set(nodes.map(x => x.id))

    const clientWidth = document.getElementById("markov-network").clientWidth;
    const margin = { top: 50, right: 60, bottom: 60, left: 60 };
    const width = clientWidth - margin.left - margin.right;
    const height = clientWidth - margin.top - margin.bottom;

    const nodeColor = d3.scaleSequential().domain([0, maxAppears])
        .interpolator(d3.interpolateRainbow);
    const linkColor = d3.scaleSequential().domain([1.0, 0]) // reverse domain so darker colors are higher probs, since we have a light background
        .interpolator(d3.interpolateCool);


    const xScale = d3.scaleLinear()
        .domain([-0.5, numCards])
        .range([0, width])

    const yScale = d3.scaleLinear()
        .domain([0, numCards])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).ticks(numCards),
        yAxis = d3.axisLeft(yScale).ticks(numCards * height / width);

    const xAxis2 = d3.axisBottom(xScale).ticks(numCards),
        yAxis2 = d3.axisLeft(yScale).ticks(numCards * height / width);

    const getRadius = () => (xScale(1) - xScale(0)) / 5

    const svg = d3.select("#markov-network").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const plot = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const scatter = plot.append("g")
        .attr("id", "scatterplot")
        .append('g');

    const highlightNode = (node) => {
        d3.selectAll(`.${pairToClass(node.id)}`) // Do paths seperately so we do not overwrite opacity calculation
            .classed("active-path", true)

        d3.selectAll(`.c${pairToClass(node.id)}, .p${pairToClass(node.id)}, #${pairToClass(node.id)}`)
            .transition().duration(200)
            .attr("opacity", 1)

        // Add labels to children

        scatter.selectAll(`.c${pairToClass(node.id)}`)
            .append("text")
            .text(thisNode => {
                const parentIdIndex = thisNode.parentIds.indexOf(node.id)
                return (thisNode.probabilities[parentIdIndex] * 100).toFixed(0) + "%"
            })
            .attr('x', thisNode => xScale(pairToArray(thisNode.id)[0]))
            .attr('y', thisNode => yScale(pairToArray(thisNode.id)[1]) + getRadius())
            .attr("dominant-baseline", "hanging")
            .attr("text-anchor", "middle")
            .attr('margin', '1em')
            .attr("font-size", getRadius() * 2)

        // Add labels to parents
        scatter.selectAll(`.p${pairToClass(node.id)}`)
            .insert("text")
            .text(thisNode => {
                if (!visibleNodes.has(thisNode.id)) {
                    return ''
                }
                const parentIdIndex = node.parentIds.indexOf(thisNode.id)
                return (node.probabilities[parentIdIndex] * 100).toFixed(0) + "%"
            })
            .attr('x', thisNode => xScale(pairToArray(thisNode.id)[0]))
            .attr('y', thisNode => yScale(pairToArray(thisNode.id)[1]) - getRadius())
            .attr("dominant-baseline", "baseline")
            .attr("text-anchor", "middle")
            .attr("font-size", getRadius() * 2)
    }

    const deHighlightNode = (node) => {
        d3.selectAll(`.${pairToClass(node.id)}`)
            .classed("active-path", false)

        d3.selectAll(`.c${pairToClass(node.id)}, .p${pairToClass(node.id)}, #${pairToClass(node.id)}`)
            .transition().duration(200)
            .attr("opacity", defaultNodeOpacity)

        scatter.selectAll(`.c${pairToClass(node.id)}, .p${pairToClass(node.id)}`)
            .selectAll("text")
            .remove()

    }

    scatter.selectAll(".dot")
        .data(nodes)
        .enter()
        .append("g") // Put every circle in a group to make room for probability labels
        .attr("class", node => {
            const childOf = node.parentIds.map(id => `c${pairToClass(id)}`);
            return `circle-box ${childOf.join(" ")}`
        })
        .attr("opacity", defaultNodeOpacity)
        .attr("id", node => pairToClass(node.id))
        .append("circle")
        .attr("class", "dot")
        .attr("r", getRadius)
        .attr("cx", node => xScale(pairToArray(node.id)[0]))
        .attr("cy", node => yScale(pairToArray(node.id)[1]))
        .style("fill", node => nodeColor(node.firstAppears))

        .on("mouseover", highlightNode)
        .on("mouseout", deHighlightNode)

    // Assign each circle a classList based on its children and parents
    nodes.forEach(node => {
        node.parentIds.forEach(id => {
            d3.select(`#${pairToClass(id)}`)
                .classed(`p${pairToClass(node.id)}`, true)
        })
    });

    makeGrid();

    // Add axis
    plot.insert("g", "#scatterplot")
        .attr("class", "x axis")
        .attr('id', "axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .attr("font-size", "1em");

    plot.insert("g", "#scatterplot")
        .attr("transform", `translate(${xScale(0)}, 0)`)
        .attr("class", "y axis")
        .attr('id', "axis--y")
        .call(yAxis)
        .attr("font-size", "1em")
        .selectAll('text')
        .attr("transform", `translate(-${xScale(0)}, 0)`);

    // Add axis titles
    svg.append("text")
        .attr('id', 'title-axis-x')
        .attr("x", margin.left + width / 2)
        .attr("y", margin.top + height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .text("Colors seen by player");

    svg.append("text")
        .attr('id', 'title-axis-y')
        .attr("x", margin.left / 2)
        .attr("y", margin.top + (height / 2) - 10)
        .attr("transform", `rotate(-90, ${margin.left / 2}, ${margin.top + (height / 2)})`)
        .attr("text-anchor", "middle")
        .text("Cards not viewed by player");

    // Add edges
    const edgeData = nodes.flatMap(node => // all the edges
        node.parentIds.map((parentId, index) =>
            [node.id, parentId, node.probabilities[index]]
        )
    )

    const getDForEdge = edge => {
        const source = pairToArray(edge[0])
        const target = pairToArray(edge[1])
        if (!visibleNodes.has(edge[1])) {
            // Make edge a line of just a single point for transition reasons
            return `M ${xScale(source[0])} ${yScale(source[1])} L ${xScale(source[0])} ${yScale(source[1])}`
        }
        const distance = Math.sqrt((source[0] - target[0]) ** 2 + (source[1] - target[1]) ** 2)

        if (distance > Math.sqrt(2)) {
            const midPoint = [(source[0] + target[0]) / 2, (source[1] + target[1]) / 2]
            if (visibleNodes.has(`(${midPoint[0]}, ${midPoint[1]})`)) {
                const controlPoint = [midPoint[0] + (source[1] - target[1] !== 0 ? 1 : 0),
                midPoint[1] + (source[0] - target[0] !== 0 ? 1 : 0)]
                return `M ${xScale(source[0])} ${yScale(source[1])} 
                        Q ${xScale(controlPoint[0])} ${yScale(controlPoint[1])}
                          ${xScale(target[0])} ${yScale(target[1])}`
            }
        }
        return `M ${xScale(source[0])} ${yScale(source[1])} L ${xScale(target[0])} ${yScale(target[1])}`
    };


    plot.insert("g", "#scatterplot")
        .attr("id", "edges")
        .selectAll("path")
        .data(edgeData)
        .enter()
        .append("path")
        .attr("stroke", edge => linkColor(edge[2]))
        .attr("stroke-width", 3)
        .attr("fill", "none")
        .attr("opacity", edge => Math.max(edge[2] / 3, 0.05))
        .attr("class", edge => `${pairToClass(edge[0])} ${pairToClass(edge[1])}`)
        .attr("d", getDForEdge);

    // Add arrowheads
    const transformArrowhead = edge => {
        let scale = 2;
        const source = pairToArray(edge[0])
        const target = pairToArray(edge[1])

        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        let angle = Math.atan2(-dy, -dx);

        const distance = Math.sqrt((source[0] - target[0]) ** 2 + (source[1] - target[1]) ** 2)

        if (distance > Math.sqrt(2)) {
            const midPoint = [(source[0] + target[0]) / 2, (source[1] + target[1]) / 2]
            if (visibleNodes.has(`(${midPoint[0]}, ${midPoint[1]})`)) { // Midpoint so our edge is at an angle
                if (Math.abs(dx) < 1e-10) { // No change in X so we come from the side
                    angle = Math.atan2(-dy, -1.414);
                    scale += 1.5;
                }
                else if (Math.abs(dy) < 1e-10) { // No change in Y so we come from the top
                    angle = Math.atan2(-1.414, -dx);
                    scale += 1.5;
                } else { // Change in both so we angle in from top left
                    angle = Math.atan2(-10, 1);
                    scale += 1.5;

                }
            }
        }

        const angleAsDegrees = angle * 180 / Math.PI

        const triangleCenterX = xScale(source[0]) - Math.cos(angle) * getRadius() * scale;
        const triangleCenterY = yScale(source[1]) + Math.sin(angle) * getRadius() * scale;
        return `translate(${triangleCenterX} , ${triangleCenterY}) rotate(${-angleAsDegrees + 90})`;
    }

    const arrow = d3.symbol().type(d3.symbolTriangle).size(getRadius() ** 2);
    const invisibleArrow = d3.symbol().type(d3.symbolTriangle).size(1);
    plot.insert('g', "#scatterplot")
        .attr("id", "arrowheads")
        .selectAll('path')
        .data(edgeData)
        .enter()
        .append('path')
        .attr('d', arrow)
        .attr('opacity', edge => 0) // Arrows add clutter so we make them invisible until asked for
        .attr("class", edge => `${pairToClass(edge[0])} ${pairToClass(edge[1])}`)
        .attr('transform', transformArrowhead)
        .attr("fill", edge => linkColor(edge[2]))

    function makeGrid() {
        plot.insert("g", '#scatterplot')
            .attr("class", "grid grid-x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis2
                .tickSize(-height)
                .tickFormat(''));

        plot.insert("g", '#scatterplot')
            .attr("class", "grid grid-y")
            .call(yAxis2
                .tickSize(-width)
                .tickFormat(''));

        plot.selectAll('.grid')
            .selectAll('line')
            .attr('stroke', 'lightgray');
    }


    // Add filtering abilities for number of pairs in game with nice transitions
    d3.select("#select-pairs").on('change', function () {
        const numPairs = +this.value;

        xScale
            .domain([-0.5, numPairs * 2])
            .range([0, width]);
        yScale
            .domain([0, numPairs * 2])
            .range([height, 0]);

        xAxis.ticks(numPairs * 2),
            yAxis.ticks(numPairs * 2 * height / width);

        xAxis2.ticks(numPairs * 2),
            yAxis2.ticks(numPairs * 2 * height / width);

        plot.select("#axis--y")
            .transition().duration(1000)
            .attr("transform", `translate(${xScale(0)}, 0)`)
            .call(yAxis)
            .selectAll('text')
            .attr("transform", `translate(-${xScale(0)}, 0)`);

        plot.select("#axis--x")
            .transition().duration(1000)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        plot.select(".grid.grid-x")
            .transition().duration(1000)
            .call(xAxis2
                .tickSize(-height)
                .tickFormat(''));

        plot.select(".grid.grid-y")
            .transition().duration(1000)
            .call(yAxis2
                .tickSize(-width)
                .tickFormat(''));

        plot.selectAll('.grid')
            .selectAll('line')
            .attr('stroke', 'lightgray');

        visibleNodes.clear();

        scatter.selectAll(".dot")
            .transition().duration(1000)
            .attr("r", node => {
                if (node.firstAppears <= numPairs) {
                    visibleNodes.add(node.id)
                    return getRadius()
                }
                return "0"; // Basically make not visible
            })
            .attr("cx", node => xScale(pairToArray(node.id)[0]))
            .attr("cy", node => yScale(pairToArray(node.id)[1]))

        plot.select("#edges")
            .selectAll("path")
            .transition().duration(1000)
            .attr("d", getDForEdge);

        // update arrowheads
        arrow.size(getRadius() ** 2);
        plot.select("#arrowheads")
            .selectAll("path")
            .transition().duration(1000)
            .attr('d', edge => {
                if (!visibleNodes.has(edge[1])) {
                    return invisibleArrow();
                }
                return arrow();
            })
            .attr('transform', transformArrowhead)
    });


    document.getElementById("select-pairs").dispatchEvent(new Event("change"))
}


d3.json("/assets/js/matching/data/state-change-data-10-pairs.json", (err, data) => { // limit to 10 to not overwhelm user
    console.error(err);
}).then((data) => {
    drawPlot(data); 
});
