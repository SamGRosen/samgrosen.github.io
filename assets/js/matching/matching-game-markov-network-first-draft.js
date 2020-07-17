// Requires loading of:
// https://github.com/erikbrinkman/d3-dag

const levelsForN3 =  [{'id': '(0, 0)', 'firstAppears': 0, 'parentIds': ['(0, 2)', '(1, 1)'], 'probabilities': [1.0, 1.0]}, {'id': '(0, 2)', 'firstAppears': 1, 'parentIds': ['(0, 4)', '(1, 3)'], 'probabilities': [0.3333333333333333, 0.3333333333333333]}, {'id': '(0, 4)', 'firstAppears': 2, 'parentIds': ['(0, 6)'], 'probabilities': [0.2]}, {'id': '(2, 2)', 'firstAppears': 2, 'parentIds': ['(0, 4)', '(2, 4)', '(3, 2)'], 'probabilities': [0.6666666666666667, 0.16666666666666666, 1.0]}, {'id': '(1, 1)', 'firstAppears': 2, 'parentIds': ['(2, 2)', '(1, 3)', '(2, 1)'], 'probabilities': [1.0, 0.33333333333333337, 1.0]}, {'id': '(3, 2)', 'firstAppears': 3, 'parentIds': ['(2, 4)'], 'probabilities': [0.3333333333333333]}, {'id': '(1, 3)', 'firstAppears': 3, 'parentIds': ['(2, 4)'], 'probabilities': [0.5]}, {'id': '(2, 1)', 'firstAppears': 3, 'parentIds': ['(1, 3)'], 'probabilities': [0.33333333333333337]}, {'id': '(0, 6)', 'firstAppears': 3, 'parentIds': [], 'probabilities': []}, {'id': '(2, 4)', 'firstAppears': 3, 'parentIds': ['(0, 6)'], 'probabilities': [0.8]}]
const levelsForN4 = [{'id': '(0, 0)', 'firstAppears': 0, 'parentIds': ['(0, 2)', '(1, 1)'], 'probabilities': [1.0, 1.0]}, {'id': '(0, 2)', 'firstAppears': 1, 'parentIds': ['(0, 4)', '(1, 3)'], 'probabilities': [0.3333333333333333, 0.3333333333333333]}, {'id': '(0, 4)', 'firstAppears': 2, 'parentIds': ['(0, 6)', '(1, 5)'], 'probabilities': [0.2, 0.2]}, {'id': '(2, 2)', 'firstAppears': 2, 'parentIds': ['(0, 4)', '(2, 4)', '(3, 2)', '(3, 3)'], 'probabilities': [0.6666666666666667, 0.16666666666666666, 1.0, 1.0]}, {'id': '(1, 1)', 'firstAppears': 2, 'parentIds': ['(2, 2)', '(1, 3)', '(2, 1)'], 'probabilities': [1.0, 0.33333333333333337, 1.0]}, {'id': '(3, 2)', 'firstAppears': 3, 'parentIds': ['(2, 4)'], 'probabilities': [0.3333333333333333]}, {'id': '(1, 3)', 'firstAppears': 3, 'parentIds': ['(2, 4)', '(1, 5)', '(2, 3)'], 'probabilities': [0.5, 0.2, 1.0]}, {'id': '(2, 1)', 'firstAppears': 3, 'parentIds': ['(1, 3)'], 'probabilities': [0.33333333333333337]}, {'id': '(0, 6)', 'firstAppears': 3, 'parentIds': ['(0, 8)'], 'probabilities': [0.14285714285714285]}, {'id': '(2, 4)', 'firstAppears': 3, 'parentIds': ['(0, 6)', '(2, 6)', '(3, 4)'], 'probabilities': [0.8, 0.13333333333333336, 1.0]}, {'id': '(2, 6)', 'firstAppears': 4, 'parentIds': ['(0, 8)'], 'probabilities': [0.8571428571428572]}, {'id': '(3, 3)', 'firstAppears': 4, 'parentIds': ['(4, 4)', '(1, 5)'], 'probabilities': [1.0, 0.4]}, {'id': '(4, 4)', 'firstAppears': 4, 'parentIds': ['(2, 6)'], 'probabilities': [0.2666666666666667]}, {'id': '(1, 5)', 'firstAppears': 4, 'parentIds': ['(2, 6)'], 'probabilities': [0.3333333333333333]}, {'id': '(2, 3)', 'firstAppears': 4, 'parentIds': ['(1, 5)'], 'probabilities': [0.2]}, {'id': '(0, 8)', 'firstAppears': 4, 'parentIds': [], 'probabilities': []}, {'id': '(3, 4)', 'firstAppears': 4, 'parentIds': ['(2, 6)'], 'probabilities': [0.2666666666666667]}]
const levelsForN5 = [{'id': '(0, 0)', 'firstAppears': 0, 'parentIds': ['(0, 2)', '(1, 1)'], 'probabilities': [1.0, 1.0]}, {'id': '(0, 2)', 'firstAppears': 1, 'parentIds': ['(0, 4)', '(1, 3)'], 'probabilities': [0.3333333333333333, 0.3333333333333333]}, {'id': '(0, 4)', 'firstAppears': 2, 'parentIds': ['(0, 6)', '(1, 5)'], 'probabilities': [0.2, 0.2]}, {'id': '(2, 2)', 'firstAppears': 2, 'parentIds': ['(0, 4)', '(2, 4)', '(3, 2)', '(3, 3)'], 'probabilities': [0.6666666666666667, 0.16666666666666666, 1.0, 1.0]}, {'id': '(1, 1)', 'firstAppears': 2, 'parentIds': ['(2, 2)', '(1, 3)', '(2, 1)'], 'probabilities': [1.0, 0.33333333333333337, 1.0]}, {'id': '(3, 2)', 'firstAppears': 3, 'parentIds': ['(2, 4)'], 'probabilities': [0.3333333333333333]}, {'id': '(1, 3)', 'firstAppears': 3, 'parentIds': ['(2, 4)', '(1, 5)', '(2, 3)'], 'probabilities': [0.5, 0.2, 1.0]}, {'id': '(2, 1)', 'firstAppears': 3, 'parentIds': ['(1, 3)'], 'probabilities': [0.33333333333333337]}, {'id': '(0, 6)', 'firstAppears': 3, 'parentIds': ['(0, 8)', '(1, 7)'], 'probabilities': [0.14285714285714285, 0.14285714285714285]}, {'id': '(2, 4)', 'firstAppears': 3, 'parentIds': ['(0, 6)', '(2, 6)', '(3, 4)', '(3, 5)'], 'probabilities': [0.8, 0.13333333333333336, 1.0, 0.6]}, {'id': '(2, 6)', 'firstAppears': 4, 'parentIds': ['(0, 8)', '(2, 8)', '(3, 6)'], 'probabilities': [0.8571428571428572, 0.10714285714285714, 1.0]}, {'id': '(3, 3)', 'firstAppears': 4, 'parentIds': ['(4, 4)', '(1, 5)', '(3, 5)', '(4, 3)'], 'probabilities': [1.0, 0.4, 0.1, 1.0]}, {'id': '(4, 4)', 'firstAppears': 4, 'parentIds': ['(2, 6)', '(4, 6)', '(5, 4)'], 'probabilities': [0.2666666666666667, 0.06666666666666668, 1.0]}, {'id': '(1, 5)', 'firstAppears': 4, 'parentIds': ['(2, 6)', '(1, 7)', '(2, 5)'], 'probabilities': [0.3333333333333333, 0.14285714285714288, 1.0]}, {'id': '(2, 3)', 'firstAppears': 4, 'parentIds': ['(1, 5)'], 'probabilities': [0.2]}, {'id': '(0, 8)', 'firstAppears': 4, 'parentIds': ['(0, 10)'], 'probabilities': [0.1111111111111111]}, {'id': '(3, 4)', 'firstAppears': 4, 'parentIds': ['(2, 6)'], 'probabilities': [0.2666666666666667]}, {'id': '(2, 8)', 'firstAppears': 5, 'parentIds': ['(0, 10)'], 'probabilities': [0.8888888888888888]}, {'id': '(0, 10)', 'firstAppears': 5, 'parentIds': [], 'probabilities': []}, {'id': '(2, 5)', 'firstAppears': 5, 'parentIds': ['(1, 7)'], 'probabilities': [0.14285714285714285]}, {'id': '(3, 6)', 'firstAppears': 5, 'parentIds': ['(2, 8)'], 'probabilities': [0.21428571428571427]}, {'id': '(5, 4)', 'firstAppears': 5, 'parentIds': ['(4, 6)'], 'probabilities': [0.2666666666666667]}, {'id': '(3, 5)', 'firstAppears': 5, 'parentIds': ['(4, 6)', '(1, 7)'], 'probabilities': [0.6666666666666666, 0.5714285714285715]}, {'id': '(4, 6)', 'firstAppears': 5, 'parentIds': ['(2, 8)'], 'probabilities': [0.42857142857142855]}, {'id': '(4, 3)', 'firstAppears': 5, 'parentIds': ['(3, 5)'], 'probabilities': [0.30000000000000004]}, {'id': '(1, 7)', 'firstAppears': 5, 'parentIds': ['(2, 8)'], 'probabilities': [0.25]}]

const nodeHeight = 20;
const nodeContainerHeight = nodeHeight + 4;
const nodePadding = 20;

const clientWidth = document.getElementById("markov-network").clientWidth;

const pairToClass = (pair) => {
    const commaIndex = pair.indexOf(",")
    const firstNum = pair.slice(1, commaIndex)
    const secondNum = pair.slice(commaIndex + 1, pair.length - 1).trim();
    return `c${firstNum}--${secondNum}`
};

function drawNode2(levels) {

    layoutData = d3.dagStratify()(levels)
    const layout = d3.zherebko()
        .size([clientWidth, (nodeHeight + nodePadding) * levels.length])

    layout(layoutData)

    const maxAppears = Math.max(...layoutData.descendants().map(x => x.data.firstAppears))
    // const nodeColor = d3.scaleLinear().domain([0,maxAppears])
    //                     .range(["red", "blue"])
    const circSize = 2;
    const nodeColor = d3.scaleSequential().domain([0, maxAppears])
        .interpolator(d3.interpolateViridis);
    const linkColor = d3.scaleSequential().domain([1.0, 0]) // reverse domain so darker colors are higher probs, since we have a light background
        .interpolator(d3.interpolateCool);
    const svgNode = d3.select("#markov-network")
        .append("svg")
        .attr("width", clientWidth)
        .attr("height", (nodeHeight + nodePadding) * (levels.length))
        .attr("viewBox", `${0} ${-nodeHeight} ${clientWidth} ${(nodeHeight + nodePadding) * (levels.length + 2)}`)

    const edgeDrawer = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);


    // Add edges
    svgNode.append('g')
        .selectAll('path')
        .data(
            layoutData.descendants().flatMap(node => // An absurd flat map of all the data we need for links
                node.children.map((child, index) => {
                    const parentIndex = child.data.parentIds.indexOf(node.id)
                    return [node._childLinkData[index].points, 
                            child.data.probabilities[parentIndex],
                            `${pairToClass(node.id)} ${pairToClass(child.id)}`]
                })
            )
        )
        .enter()
        .append('path')
        .attr('d', data => edgeDrawer(data[0]))
        .attr('fill', 'none')
        .attr('opacity', data => Math.max(data[1] / 3, .05))
        .attr('stroke-width', 3)
        .attr('stroke', data => linkColor(data[1]))
        .attr('class', data => data[2]);

    const highlightNode = (node) => {
        document.getElementsByClassName(pairToClass(node.id))
            .forEach(element => element.classList.add("active-path"));
        document.getElementsByClassName(`c${pairToClass(node.id)}`)
            .forEach(element => element.style["stroke-width"] = 4);
        document.getElementsByClassName(`p${pairToClass(node.id)}`)
            .forEach(element => element.style["stroke-width"] = 4);
        document.getElementById(`${pairToClass(node.id)}`).style["stroke-width"] = 4;
    }

    const deHighlightNode = (node) => {
        document.getElementsByClassName(pairToClass(node.id))
                .forEach(element => element.classList.remove("active-path")); 
        document.getElementsByClassName(`c${pairToClass(node.id)}`)
            .forEach(element => element.style["stroke-width"] = 1);
        document.getElementsByClassName(`p${pairToClass(node.id)}`)
            .forEach(element => element.style["stroke-width"] = 1);
        document.getElementById(`${pairToClass(node.id)}`).style["stroke-width"] = 1;
    }

    // Add nodes
    svgNode.append('g')
        .selectAll('text')
        .data(layoutData.descendants())
        .enter()
        .append("rect")
        .attr("width", nodeHeight * 3)
        .attr("height", nodeContainerHeight)
        .attr("stroke", "black")
        .attr("rx", nodeContainerHeight / 6)
        .attr("fill", (node) => nodeColor(node.data.firstAppears))
        .attr('class', (node) => { // assign classes based off neighbors
            console.log(node)
            const parentsOfClasses = node.children.map(child => `p${pairToClass(child.id)}`)
            const childrenOfClasses = node.data.parentIds.map(id => `c${pairToClass(id)}`);
            return `${parentsOfClasses.join(" ")} ${childrenOfClasses.join(" ")}`;
        })
        .attr('id', (node) => pairToClass(node.id))
        .attr("x", node => node.x - 3 * nodeHeight / 2)
        .attr("y", node => node.y - nodeContainerHeight/2)
        .on('mouseover', highlightNode)
        .on('mouseout', deHighlightNode)
    
    // Add text to nodes
    svgNode.append('g')
        .selectAll('text')
        .data(layoutData.descendants())
        .enter()
        .append("text")
        .text((node) => node.id.replace(" ", ""))
        .attr("font-size", nodeHeight)
        .attr("stroke", "black")
        .attr("font-weight", "700")
        .attr('fill', "white")
        .attr("x", node => node.x)
        .attr("y", node => node.y)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("cursor", "default")
        .on('mouseover', highlightNode)
        .on('mouseout', deHighlightNode)
}

drawNode2(levelsForN5)
