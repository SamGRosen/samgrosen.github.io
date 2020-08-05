---
title: "A Demonstration of the \"two-truths\" phenomenon"
collection: writings
type: "problemexploration"
permalink: /writings/two-truths
---

As a form of unsupervised learning, clustering is an inherently ill-defined problem. Often times a researcher may employ spectral clustering to find the "true" communities in a network, but what if there are two different, yet real, "truths"?

Introduction to spectral graph clustering
-----
Spectral graph clustering is a strategy to partition a graph $G = (V , E)$ into communities where $V$ is the set of nodes in the graph and $E$ is the set of edges in the graph. The idea is to map each vertex $v_i \in V$ to a vector in some low-dimensional space. By then doing conventional clustering algorithms in the low-dimensional space, each vertex can be assigned to a community.

A graph is simple if edges do not have weight or direction, nor can they have edges that start and end at the same node. On simple graphs, spectral clustering is generally the following steps with some variations in the literature <sup> [[2]](#sources) </sup>:

1. Choose a spectral embedding for $G$. This is a matrix meant to represent $G$. Some commonly used embeddings are:
    * Adjacency: $A$ where $A_{ij}$ = 1 if there is an edge from $v_i$ to $v_j$ and 0 otherwise. On simple graphs this produces a symmetric matrix.
    * Laplacian: /(L/) where $L = D - A$ where $D = A \cdot \mathbb{1}_n$ is the a diagonal matrix containing the number of neighbors of each node and $\mathbb{1}_n$ is the matrix of all ones with dimension $n=\vert V \vert$.
    * Normalized Laplacian: /( L_\text{norm} = D^{-1/2} L D^{-1/2} /) where /( D^{-1/2} /) is the diagonal matrix with entries /( \left(D^{-1/2}\right)\_{jj} = \frac{1}{\sqrt{D\_{jj}}} /) if $ v_i $ has neighbors, 0 otherwise.
2. When trying to find $k$ communities in $G$ find the top $k$ eigenvectors of importance in the spectral embedding. The most important eigenvectors in $A$ are the ones tied to the top $k$ eigenvalues in magnitude. For $L$ and $L_\text{norm}$ importance is tied to the smallest eigenvalues above 0.
3. Let $e_1,...,e_k$ be the top eigenvectors. Embed each $v_i$ as an element in $\mathbb R^k$ with each row 
4. Perform a clustering algorithm suitable for $\mathbb R^k$. The paper by Priebe et al. uses [Gaussian Mixture Models](http://statweb.stanford.edu/~tibs/stat315a/LECTURES/em.pdf) with theoretical justification. For our purposes we will use [k-means clustering](https://en.wikipedia.org/wiki/K-means_clustering). Typically a random initialization is used for clustering, so different runs of the algorithms will give different communities.

$$ \left(\begin{array}{c|c|c}
                      \\
    e_1  & ... & e_k  \\
                      \\
  \end{array}\right) $$
 
The community that $v_i$ is in is determined by the cluster of its resulting low-dimensional embedding. As an example, consider the graph represented by the following adjacency spectral embedding:

<div class="latex-and-graph">
$ A = \begin{pmatrix} 
    0 & 1 & 1 & 0 & 0 & 0 & 0 & 0 \\
    1 & 0 & 1 & 1 & 0 & 0 & 0 & 0 \\
    1 & 1 & 0 & 0 & 0 & 1 & 1 & 1 \\
    0 & 1 & 0 & 0 & 1 & 0 & 0 & 1 \\
    0 & 0 & 0 & 1 & 0 & 0 & 1 & 1 \\
    0 & 0 & 1 & 0 & 0 & 0 & 1 & 0 \\
    0 & 0 & 1 & 0 & 1 & 1 & 0 & 1 \\
    0 & 0 & 1 & 1 & 1 & 0 & 1 & 0 \\
\end{pmatrix} $

<div id="with-adjacency" class="graph-holder"></div>
</div>

To split this graph into two communities, we first find the eigenvectors associated with the 2 eigenvalues of highest magnitude. We perform an eigendecomposition on $A$ and find

<div class="latex-and-graph">

$ \begin{align} 
    \lambda_1 &= 3.487 \\ \lambda_2 &= -2.165 \\ \lambda_3 &= -1.754 \\  ... \\ \lambda_8 &= -0.359 \\

 \left(\begin{array}{c|c}
    \\
    e_1  & e_2  \\
    \\
  \end{array}\right) &= \left(\begin{array}{cc} 
    0.2152 & -0.0402 \\
    0.2831 & -0.4225 \\
    0.4673 & 0.5095  \\
    0.3048 & 0.4454  \\
    0.3379 & -0.0522 \\
    0.2577 & -0.3079 \\
    0.4316 & 0.1571  \\
    0.4420 & -0.4896
\end{array}\right) 

\end{align} $

<div id="with-eigendecomp" class="graph-holder"></div>
</div>
 


The spectral embedding of the matrix $A$ allows us to view the vertices as points in $\mathbb R^2$. After performing k-means clustering, we get two clusters and a boundary between them to divide the vertices into clusters. The grey circles are the resulting centroids from k-means clustering.

Different spectral embeddings produce different communities. See below for how Laplacian or Normalized Laplacian would have embedded our example graph in $\mathbb R^2$.

<div class="side-by-side-graphs">
    <div id="laplacian-compare-1" class="graph-holder">Laplacian</div>
    <div id="laplacian-compare-2" class="graph-holder">Normalized Laplacian</div>
</div>

We can see the laplacian-based embeddings give similar results that look significantly different than the adjacency embedding. Both laplacian-based cluster assignments seem to give good splits of the graph, while one community with adjacency-based cluster assignments seems to have little connection. Later we visualize how the embeddings can both give true, but different answers.


Below is a spectral graph clustering tool to familiar yourself with some possible configurations. Spectral view will only show two centroids as that is the dimension that our visualization shows. Click near the node to begin. (Warning: the visualization will slow down when reaching a large number of nodes)

<div id="complete-tool" class="graph-holder"></div>

The Stochastic Block Model
--------------------------
The [Stochastic Block Model](https://en.wikipedia.org/wiki/Stochastic_block_model) (SBM) is a [popular](https://scholar.google.com/scholar?rlz=1C5CHFA_enUS874US874&um=1&ie=UTF-8&lr&cites=13665266760427536344) random graph model meant to model a set of communities along with inter and intra-connections. For a set of $k$ communities, we use the definition:

$$ \operatorname{SBM}(\vec v, \mathbf{P}) \\
 \begin{align} \vec{v} \in \mathbb{N}^k :&\ \vec{v}_i \text{ is the size of the } i^{th} \text{ community } \\ 
 \mathbf{P} \in [0, 1]^{k \times k}:&\ \mathbf{P}_{ij} \text{ is the probability of an edge between }\\ & \text{ vertices in communities } i \text{ and } j \end{align} $$

Advantages of the SBM include a simple definition and a rudimentary check if certain algorithms are able to recover the parameters of the SBM.

Consider the distribution:

$$ X_1 \sim \operatorname{SBM}\left(\begin{bmatrix} 60 \\ 60 \end{bmatrix}, \begin{bmatrix} 0.30 & 0.04 \\ 0.04 & 0.03 \end{bmatrix}\right) $$

Below is a graph that is sampled from $X_1$

<div id="x1-sample" class="graph-holder"></div>


We see that the adjacency embedding performs well on the graph as we see it closely recovers the model communities. Both laplacian-based embeddings struggle to find the communities and do not give a good partition in the low-dimensional embedding as the red and green communities are mixed together.

$$ X_2 \sim \operatorname{SBM}\left(\begin{bmatrix} 60 \\ 60 \end{bmatrix}, \begin{bmatrix} 0.045 & 0.008 \\ 0.008 & 0.045 \end{bmatrix}\right) $$

<div id="x2-sample" class="graph-holder"></div>

The "two-truths" phenomenom
---------------------------
The "two-truths" phenomenom was first showed by Priebe et al. <sup> [[1]](#sources) </sup> when analyzing 



<div id="four-blocks" class="graph-holder"></div>


Sources
------

1. Carey E. Priebe, Youngser Park, Joshua T. Vogelstein, John M. Conroy,Vince Lyzinski, Minh Tang, Avanti Athreya, Joshua Cape, and Eric Bridge-ford. [On a two-truths phenomenon in spectral graph clustering](https://doi.org/10.1073/pnas.1814462116). *Proceedings of the National Academy of Sciences*, 116(13):5995–6000, 2019
2. Von Luxburg, U. (2007). [A tutorial on spectral clustering](https://arxiv.org/abs/0711.0189). *Statistics and computing*, 17(4), 395-416.

TODO:

Ensure proper network render size

Write intro/abstract type thing

Write second section

Revise first section

Appendix
--------
Code used to create the visualizations in this article can be found [here](https://github.com/SamGRosen/samgrosen.github.io/blob/master/assets/js/two-truths/two-truths.js). This code was originally forked from *[Build Your Own Graph!](https://observablehq.com/@d3/build-your-own-graph)*.

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

.latex-and-graph {
    /* display: flex; */
    display: grid;
    grid-template-columns: .1fr 1fr 1fr;
    font-size: 0.75em;
    margin: 1.5em 0;
}

.graph-holder {
    margin: auto;
}

.latex-and-graph > .graph-holder {
    width: 50%;
}

#with-eigendecomp .view-controls {
    font-size: 3em;
}

.side-by-side-graphs {
    margin: 1.5em 0;
    display: flex;
}

.side-by-side-graphs > .graph-holder {
    width: 35%;
    text-align: center;
    font-size: 1.5em;
}

.color-bar {
    display:flex;
    margin: auto 0.5em;
}

.color-bar > div {
    width: 1em;
    height: 1em;
    border-radius: 50%;
    cursor: pointer;
}

.active-control {
    color: rgb(234, 84, 84);
    text-shadow: rgb(234, 84, 84) 0 0.2em 0.4em;
}

</style>

<!-- Matrix operations -->
<script type="text/javascript" src="/assets/js/libraries/mathjs.min.js"></script>
<!-- Kmeans implementation -->
<script type="text/javascript" src="/assets/js/libraries/skmeans.min.js"></script>
<!-- Graph drawing -->
<script type="text/javascript" src="/assets/js/libraries/d3.v5.min.js"></script>
<!-- Main -->
<script type="text/javascript" src="/assets/js/two-truths/two-truths.js"></script>
<script type="text/javascript" src="/assets/js/two-truths/article-components.js"></script>
