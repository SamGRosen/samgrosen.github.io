---
title: "A Demonstration of the "two-truths phenomenon"
collection: writings
type: "problemexploration"
permalink: /writings/two-truths
---

<style>

.view-controls {
    width: 100%;
    display: flex;
    justify-content: space-between;
}

.view-controls i {
    margin: auto 0.5em;
    cursor: pointer;
}

.view-controls i:hover {
    text-shadow: rgb(170, 170, 170) 0px 0.2em 0.4em;
}

.view-controls span {
    text-transform: capitalize;
}

#control-tooltip {
    position: absolute;
    background: #EEE;
    padding: .1em .2em;
    border: 1px solid #AAA;
    font-size: .7em;
    font-weight: 300;
}

</style>

An Introduction to Spectral Clustering
-----
ijfaiojdhpdj


<div id="graph-one" class="graph-holder"></div>
<div id="graph-two" class="graph-holder"></div>


Sources
------

1. Spectra Clustering Guide https://www.cs.cmu.edu/~aarti/Class/10701/readings/Luxburg06_TR.pdf
2. Two-truths paper
* Link to https://observablehq.com/@d3/build-your-own-graph



<!-- Matrix operations -->
<script type="text/javascript" src="/assets/js/libraries/mathjs.min.js"></script>
<!-- Kmeans implementation -->
<script type="text/javascript" src="/assets/js/libraries/skmeans.min.js"></script>
<!-- Graph drawing -->
<script type="text/javascript" src="/assets/js/libraries/d3.v5.min.js"></script>
<!-- GMM implementation -->
<script type="text/javascript" src="/assets/js/libraries/gmm.js"></script>

<script type="text/javascript" src="/assets/js/two-truths/two-truths.js"></script>