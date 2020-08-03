---
title: "A Demonstration of the \"two-truths\" phenomenon"
collection: writings
type: "problemexploration"
permalink: /writings/two-truths
---

Spectral graph clustering is a popular way to find communities in networks. However, E. Priebe et al. have shown a case where 

An Introduction to Spectral Clustering
-----
Spectral graph clustering is a strategy to partition a graph $G = (V , E)$ into communities where $V$ is the set of nodes in the graph and $E$ is the set of edges in the graph. The idea is to map each vertex $v_i \in V$ to a vector in some low-dimensional space. By then doing conventional clustering algorithms in the low-dimensional space each vertex can be assigned to a cluster or community.

A graph is simple if edges do not have weight or direction, nor can they have edges that start and end at the same node. On simple graphs, spectral clustering is generally the following steps with some variations in the literature:

1. Choose a spectral embedding for $G$. This is a matrix meant to represent $G$. Some commonly used embeddings are:
    * Adjacency: $A$ where $A_{ij}$ = 1 if there is an edge from $v_i$ to $v_j$ and 0 otherwise. On simple graphs this produces a symmetric matrix.
    * Laplacian: $L$ where $L = D - A$ where $D = A \cdot \mathbb{1}_n$ is the a diagonal matrix containing the number of neighbors of each node and $\mathbb{1}_n$ is the matrix of all ones with dimension $n=\vert V \vert$.
    * Normalized Laplacian: $L_\text{norm} = D^{-1/2} L D^{-1/2} $ where $ D^{-1/2} $ is the diagonal matrix with entries \( D^{-1}_{ii} = \frac{1}{\sqrt{D_{ii}}} \) if $ v_i $ has neighbors, 0 otherwise.
2. When trying to find $k$ communities in $G$ find the top $k$ eigenvectors of importance in the spectral embedding. The most important eigenvectors in $A$ are the ones tied to the top $k$ eigenvalues in magnitude. For $L$ and $L_\text{norm}$ importance is tied to the smallest eigenvalues above 0.
3. Let $e_1,...,e_k$ be the top eigenvectors. Embed each $v_i$ as an element in $\mathbb R^k$ with each row 
4. Perform a clustering algorithm suitable for $\mathbb R^k$. The paper by [insert cite authors here] uses [Gaussian Mixture Models](something.com) for clustering the data points representing the vertices in the new low-dimensional space. For our purposes we will use [k-means clustering](something.com).

$$ \left(\begin{array}{c|c|c}
                      \\
    e_1  & ... & e_k  \\
                      \\
  \end{array}\right) $$
 
The community that $v_i$ is in is determined by the cluster of its resulting low-dimensional embedding. As an example, consider the graph represented by the following adjacency spectral embedding:

<div class="latex-and-graph">
$ A = \begin{pmatrix} 0 & 1 & 1 & 0 & 0 & 0 & 0 & 0 \\
    1 & 0 & 1 & 1 & 0 & 0 & 0 & 0 \\
    1 & 1 & 0 & 0 & 0 & 1 & 1 & 1 \\
    0 & 1 & 0 & 0 & 1 & 0 & 0 & 1 \\
    0 & 0 & 0 & 1 & 0 & 0 & 1 & 1 \\
    0 & 0 & 1 & 0 & 0 & 0 & 1 & 0 \\
    0 & 0 & 1 & 0 & 1 & 1 & 0 & 1 \\
    0 & 0 & 1 & 1 & 1 & 0 & 1 & 0 \\
\end{pmatrix} $

<div id="graph-one" class="graph-holder"></div>
</div>

To split this graph into two clusters, we first find the eigenvectors associated with the 2 eigenvalues of highest magnitude. We perform an eigendecomposition on $A$ and get that

<div class="latex-and-graph">

$ \begin{align} \lambda_1 &= 3.487 \\ \lambda_2 &= -2.165 \\ \lambda_3 &= -1.754 \\  ... \\ \lambda_8 &= -0.359 \\

 \left(\begin{array}{c|c}
    \\
     
    e_1  & e_2  \\
    \\
    
  \end{array}\right) &= \left(\begin{array}{cc} -0.0402 & 0.2152 \\
-0.4225 & 0.2831 \\
0.5095 & 0.4673 \\
0.4454 & 0.3048 \\
-0.0522 & 0.3379 \\
-0.3079 & 0.2577 \\
0.1571 & 0.4316 \\
-0.4896 & 0.4420
\end{array}\right) 

\end{align} $

<div id="graph-two" class="graph-holder"></div>
</div>
 


The spectral embedding of the matrix $A$ allows us to view the vertices as points in $\mathbb R^2$. After performing k-means clustering, we get two clusters and a boundary between them to divide the vertices into clusters. The grey circles are the resulting centroids from k-means clustering.

Different spectral embeddings produce different communities. See below for how Laplacian or Normalized Laplacian would have embedded our example graph in $\mathbb R^2$.

<div class="side-by-side-graphs">
<div id="graph-three" class="graph-holder">Laplacian</div>
<div id="graph-four" class="graph-holder">Normalized Laplacian</div>
</div>

We can see the laplacian-based embeddings give similar results that look significantly different than the adjacency embedding. Both laplacian-based cluster assignments seem to give good splits of the graph, while one community with adjacency-based cluster assignments seems to have little connection. Later we visualize how the embeddings can both give true, but different answers.


Below is a spectral graph clustering tool to familiar yourself with some possible configurations. Spectral view will only show two centroids as that is the dimension that our visualization shows. Click near the node to begin. (Warning: the visualization will slow down when reaching a large number of nodes)

<div id="graph-five" class="graph-holder"></div>



The "two-truths" phenomenom
---------------------------

Sources
------

1. Spectra Clustering Guide https://www.cs.cmu.edu/~aarti/Class/10701/readings/Luxburg06_TR.pdf
2. Two-truths paper
* Link to https://observablehq.com/@d3/build-your-own-graph

TODO:

Fix dragging

Ensure proper network render size

Write intro/abstract type thing

Write second section

Revise first section


<!-- Matrix operations -->
<script type="text/javascript" src="/assets/js/libraries/mathjs.min.js"></script>
<!-- Kmeans implementation -->
<script type="text/javascript" src="/assets/js/libraries/skmeans.min.js"></script>
<!-- Graph drawing -->
<script type="text/javascript" src="/assets/js/libraries/d3.v5.min.js"></script>
<!-- Main -->
<script type="text/javascript" src="/assets/js/two-truths/two-truths.js"></script>



<style>

.view-controls {
    width: 100%;
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.view-controls i {
    margin: auto 0.5em;
    cursor: pointer;
}

.view-controls i:hover {
    text-shadow: rgb(170 & 170 & 170) 0px 0.2em 0.4em;
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

.latex-and-graph {
    /* display: flex; */
    display: grid;
    grid-template-columns: .1fr 1fr 1fr;
    font-size: 0.75em;
    margin: 1.5em 0;
}

.graph-holder {
    margin: auto;
    width: 50%;
}

#graph-one {
    width: 50%;
}

#graph-two .view-controls {
    font-size: 3em;
}

#graph-five {
    width: 75%;
}

.side-by-side-graphs {
    margin: 1.5em 0;
    display: flex;
}

.side-by-side-graphs .graph-holder {
    width: 35%;
    text-align: center;
    font-size: 1.5em;
}

</style>