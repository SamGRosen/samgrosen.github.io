// https://stackoverflow.com/a/24785497/
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}

// https://stackoverflow.com/a/56821215/
// We also add a filter for a the domain endpoint as it occasionally misses the clip
const integerTickValues = scale => scale.ticks().filter(tick => 
    Number.isInteger(tick) && tick != scale.domain()[1]    
);

const formatProbability = prob => {
    const asExponential = prob.toExponential()
    const [firstDigit, exponentAsStr] = asExponential.split("e-")
    const exponent = exponentAsStr !== undefined ? parseFloat(exponentAsStr) : undefined;
    if(exponent === undefined || exponent < 5) {
        return (100 * prob).toFixed(2) + "%";
    }

    return `${firstDigit.slice(0, 5)}*10^${-exponent}`;
} 

function drawFailurePDF(data) {
    const numCases = data.length
    const everyPDFValue = data.flatMap((row, rowIndex) =>
        row.pdf.map((probability, index) => ({
            probability,
            numberOfFailures: index,
            initialNumPairs: rowIndex + 1
        })
        )
    )

    const probabilityColor = d3.scaleSqrt()
        .domain([0, 0.5, 1.0])
        .range(['rgb(250, 250, 255)', 'green', '#08316D'])
        .interpolate(d3.interpolateRgb);

    const clientWidth = document.getElementById("failure-pdf").clientWidth * .9;
    const margin = { top: 80, right: 20, bottom: 50, left: 80 };
    const width = clientWidth - margin.left - margin.right;
    const height = clientWidth - margin.top - margin.bottom;

    const xScale = d3.scaleLinear();
    const yScale = d3.scaleLinear();


    const xAxis = d3.axisTop(xScale);
    const yAxis = d3.axisLeft(yScale);

    updateScales(numCases + 1); // +1 to circumvent overzealous clipping

    let cellSmallerSide, cellWidth, cellHeight;
    
    updateCellDim();

    const svg = d3.select("#failure-pdf").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const plot = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("id", "plot");

    const clip = plot.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Add tooltip when hovered over cell
    const tooltip = plot
        .insert("g")
        .attr("id", "tooltip")
    
    const tooltipWidth = xScale(data.length * .9) - xScale(data.length / 3)

    tooltip.append("text")
        .attr("x", xScale(data.length * .35))
        .attr("y", yScale(data.length * 0.1))
        .attr("font-weight", 500)
        
    const cellMouseover = d => {
        boxHighlighter
            .attr("x", xScale(d.numberOfFailures))
            .attr("y", yScale(d.initialNumPairs))

        tooltip.select("text")
            .text(`${d.initialNumPairs} initial pairs, 
                   chance to finish with ${d.numberOfFailures} failures
                   (${d.numberOfFailures + d.initialNumPairs} moves):
                   ${formatProbability(d.probability)}.`)
            .call(wrap, tooltipWidth);

    }
    // Add cells
    const heatmap = plot.append("g")
        .attr("id", "heatmap")
        .attr("clip-path", "url(#clip)")

    heatmap.selectAll(".prob-square")
        .data(everyPDFValue)
        .enter()
        .append("rect")
        .attr("class", "prob-square")
        .attr("fill", d => probabilityColor(d.probability))
        .on("mouseover", cellMouseover)

    updateHeatmap();

    // Add a border on cells that are hovered over 
    const boxHighlighter = plot.insert("rect")
        .attr("id", "box-highlighter")
        .attr("fill", "none")
        .attr("stroke", "#222")

    updateBoxHighlighter();

    // Add axis
    plot.append("g")
        .attr("class", "y axis")
        .attr('id', "axis--y")
        .call(d3.axisLeft(yScale))
        .attr("font-size", "1em")


    plot.append("g")
        .attr("class", "x axis")
        .attr('id', "axis--x")
        .call(d3.axisTop(xScale))
        .attr("font-size", "1em")

    updateAxis();

    // Add expectation bars
    const expectations = plot
        .append("g")
        .attr("id", "expectations")
        .attr("clip-path", "url(#clip)")

    expectations
        .selectAll(".mean-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", ".mean-bar")
        .attr("fill", "red")

    updateExpectations();

    // Add grid
    plot.append("g")
        .attr("class", "grid grid-y")
        .call(d3.axisLeft(yScale))
        .attr("transform", `translate(0, ${yScale(1.5)})`)
        .attr("font-size", "1em")

    plot.append("g")
        .attr("class", "grid grid-x")
        .call(d3.axisTop(xScale))
        .attr("transform", `translate(${xScale(0.5)}, 0)`)
        .attr("font-size", "1em")

    updateGrid();

    // Add axis titles
    svg.append("text")
        .attr('id', 'title-axis-x')
        .attr("x", margin.left + width / 2)
        .attr("y", margin.top / 4)
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .text("Final Failures");

    svg.append("text")
        .attr('id', 'title-axis-y')
        .attr("x", margin.left / 2)
        .attr("y", margin.top + (height / 2) - 10)
        .attr("transform", `rotate(-90, ${margin.left / 2}, ${margin.top + (height / 2)})`)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("Initial Pairs");

    // Add Legend
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "prob-color-scale")

    // https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
    // We need to do a lot of stops to approximate the sqrt color scale
    gradient.selectAll("stop")
        .data([...Array(1001).keys()].map(percent => ({
            offset: `${percent/10}%`,
            color: probabilityColor(percent/1000)
        })))
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    const legendWidth = clientWidth * .4;
    const legend = svg.append("g")
        .attr("id", "legend")
    const legendXOffset = margin.left + width * .5;
    const legendYOffset = height + margin.top + 20;
    const legendScale = d3.scaleLinear()
        .domain([0, 1.0])
        .range([legendXOffset, legendXOffset + legendWidth])
    const legendFontSize = 0.75
    legend.append("rect")
        .attr("x", legendXOffset)
        .attr("y", legendYOffset)
        .attr("width", legendWidth)
        .attr("height", 20)
        .attr("fill", "url(#prob-color-scale)");

    legend.append("g")
        .attr("class", "legend axis")
        .attr('id', "axis--legend")
        .call(d3.axisTop(legendScale).ticks(5))
        .attr("font-size", "0.5em")
        .attr("transform", `translate(0, ${legendYOffset})`)
        .select(".domain")
        .remove()

    const label = legend.append("text")
        .attr("x", margin.left)
        .attr("y", legendYOffset)
        .attr("dominant-baseline", "hanging")
        .attr("font-size", `${legendFontSize}em`)
        .text("Expected failures = ")
    
    
    legend.append("rect")
        .attr("x", margin.left + label.node().getComputedTextLength() + 10)
        .attr("y", legendYOffset)
        .attr("height", `${legendFontSize}em`)
        .attr("width", `${legendFontSize/4}em`)
        .attr("fill", "red")

    // Add filtering abilities for number of pairs in game with nice transitions
    d3.select("#pdf-range").on('input', function () {
        updateScales(+this.value + 1);

        updateCellDim();

        updateAxis();

        updateGrid();

        updateHeatmap();

        updateBoxHighlighter();

        updateExpectations();

        document.getElementById("pdf-num").innerText = +this.value;
    });

    function updateScales(domainMax) {
        xScale
            .domain([0, domainMax])
            .range([0, width]);
        yScale
            .domain([1, domainMax])
            .range([0, height]);

        xAxis.ticks(domainMax),
        yAxis.ticks(domainMax * height / width);
    }

    function updateCellDim() {
        cellSmallerSide = Math.min(xScale(1) - xScale(0), yScale(1) - yScale(0));
        cellWidth = xScale(1) - xScale(0);
        cellHeight = yScale(1) - yScale(0);
    }

    function updateAxis() {
        plot.select("#axis--y")
            .transition().duration(1000)
            .call(d3.axisLeft(yScale)
                .tickValues(integerTickValues(yScale))
                .tickFormat(d3.format("d")))
            .attr("transform", `translate(0, ${yScale(1.5)})`)
            
        plot.select("#axis--y") // Do seperately so we do not have to transition this removal
            .select(".domain")
            .remove()

        plot.select("#axis--x")
            .transition().duration(1000)
            .call(d3.axisTop(xScale)
                .tickValues(integerTickValues(xScale))
                .tickFormat(d3.format("d")))
            .attr("transform", `translate(${xScale(0.5)}, 0)`)

        plot.select("#axis--x") 
            .select(".domain")
            .remove()
    }

    function updateGrid() {
        plot.select(".grid.grid-y")
            .transition().duration(1000)
            .call(d3.axisLeft(yScale)
                .tickSize(width)
                .tickFormat('')
                .tickValues(integerTickValues(yScale)))
            .attr("transform", `translate(${width}, ${yScale(1.5)})`)

        plot.select(".grid.grid-x")
            .transition().duration(1000)
            .call(d3.axisTop(xScale)
                .tickSize(height)
                .tickFormat('')
                .tickValues(integerTickValues(yScale)))
            .attr("transform", `translate(${xScale(0.5)}, ${height})`)

        plot.selectAll('.grid')
            .selectAll('line')
            .attr('stroke', '#000')
            .attr('opacity', 0.1);
    }

    function updateHeatmap() {
        heatmap.selectAll(".prob-square")
            .transition().duration(1000)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("x", d => xScale(d.numberOfFailures))
            .attr("y", d => yScale(d.initialNumPairs))
    }

    function updateBoxHighlighter() {
        boxHighlighter
            .attr("x", -10000)
            .attr("y", -10000)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("stroke-width", cellSmallerSide / 4)
            .attr("rx", cellSmallerSide / 4)
    }

    function updateExpectations() {
        expectations
            .selectAll("rect")
            .transition().duration(1000)
            .attr("width", cellWidth / 4)
            .attr("height", cellHeight)
            .attr("x", (game) => xScale(game.expectation) - cellWidth / 8)
            .attr("y", (_, i) => yScale(i + 1))
    }

    document.getElementById("pdf-range").dispatchEvent(new Event("input"))

}


d3.json("/assets/js/matching/data/expected-failures-data.json", (err, data) => {
    console.error(err);
}).then((data) => {
    drawFailurePDF(data);
});
