---
title: "A demonstration of the \"two-truths\" phenomenon"
collection: writings
type: "problemexploration"
permalink: /writings/two-truths
---

As a form of unsupervised learning, clustering is an inherently ill-defined problem. Often times a researcher may employ spectral clustering to find the "true" communities in a network, but what if there are two different, yet correct, "truths"?

An introduction to spectral graph clustering
-----
A community in a graph is generally a set of nodes with many connections between them, and less connections to nodes not in the set. Spectral graph clustering is a strategy to partition a graph \\(G = (V , E)\\) into communities where \\( V \\) is the set of nodes in the graph and \\( E \\) is the set of edges in the graph. Graphs are discrete structures with an intrinsic connection to matrices. As a consequence, a researcher can avoid using graph traversal algorithms and instead use a corresponding matrix to find communities. The basis of spectral graph clustering (for finding \\( k \\) communities) is mapping each vertex \\( v_i \\) to a vector in some low-dimensional space (usually \\(\mathbb R^k\\)). A cluster is a set of close or intertwined points in space. Because each vertex has been mapped to a point, we are able to find communities by instead finding clusters in a low-dimensional space by using the one-to-one correspondence between vertices and points.

A graph is simple if edges do not have weight or direction. Additionally, edges may not start and end at the same node. On simple graphs, spectral clustering is usually the following steps with some variation in the literature <sup> [[2]](#sources) </sup>:

1\. 
Choose a spectral embedding for \\(G\\). This is derived from the matrix meant to represent \\(G\\). Some commonly used matrices are:

* Adjacency: \\( A \\) where \\(A_{ij}\\) = 1 if there is an edge from \\( v_i \\) to \\( v_j \\) and 0 otherwise. On simple graphs this produces a symmetric matrix of only \\( 0 \\)'s and \\( 1 \\)'s. The eigendecomposition of \\(A\\) is used to calculate the adjacency spectral embedding (ASE).
* Laplacian: \\(L = D - A\\) and \\(D = A \cdot \mathbb{1}_n\\). \\( D \\) is the diagonal matrix containing the number of neighbors for each node and \\(\mathbb{1}_n\\) is the vector of all \\( 1 \\)'s with dimension \\(n=\vert V \vert\\). Similar to above, the eigendecomposition of \\(L\\) calculates the laplacian spectral embedding (LSE).
* Normalized Laplacian: \\( L_\text{norm} = D^{-1/2} L D^{-1/2} \\) where \\( D^{-1/2} \\) is the diagonal matrix with entries \\( \left(D^{-1/2}\right)\_{jj} = \frac{1}{\sqrt{D\_{jj}}} \\) if \\( v_j \\) has neighbors, 0 otherwise. The resulting eigendecomposition calculates the normalized laplacian spectral embedding (nLSE).

2\. When trying to find \\( k \\) communities in \\( G \\), find the "best" \\( k \\) eigenvectors in the spectral embedding. The best \\( k \\) eigenvectors of \\( A \\) are tied to the *largest* \\( k \\) eigenvalues in magnitude. For \\( L \\) and \\(L_\text{norm}\\) the best eigenvectors are tied to *smallest* eigenvalues above 0. These matrices have many special properties that make them good candidates for calculating an embedding. See [[2]](#sources) for more details. 

3\. Let \\(e_1,...,e_k\\) be the top eigenvectors. Associate \\( v_i \\) with the \\(i^{th}\\) row in the following matrix. This collection of points is the low-dimensional embedding of \\( G \\).

$$ \left[\begin{array}{c|c|c} \\ e_1  & ... & e_k  \\ \\ \end{array}\right] \in \mathbb{R}^{n \times k} $$

4\. Perform a clustering algorithm suitable for the low-dimensional space (probably \\(\mathbb R^k\\)). This article is based on a paper by Priebe et al.<sup> [[1]](#sources) </sup> that uses [Gaussian Mixture Models](http://statweb.stanford.edu/~tibs/stat315a/LECTURES/em.pdf) (GMM) with theoretical justification. For our purposes we will use [k-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) for simplicity and numerical stability. Both GMM and k-means are usually randomly initialized; as a consequence separate runs may be give different results.

5\. Create the communities by mapping the points in each cluster back to its corresponding vertex. We finish with each vertex assigned to a single community.
 
Consider the following adjacency matrix and the induced graph below:

<div class="latex-and-graph">
\[ A = \begin{bmatrix} 
    0 & 1 & 1 & 0 & 0 & 0 & 0 & 0 \\
    1 & 0 & 1 & 1 & 0 & 0 & 0 & 0 \\
    1 & 1 & 0 & 0 & 0 & 1 & 1 & 1 \\
    0 & 1 & 0 & 0 & 1 & 0 & 0 & 1 \\
    0 & 0 & 0 & 1 & 0 & 0 & 1 & 1 \\
    0 & 0 & 1 & 0 & 0 & 0 & 1 & 0 \\
    0 & 0 & 1 & 0 & 1 & 1 & 0 & 1 \\
    0 & 0 & 1 & 1 & 1 & 0 & 1 & 0 \\
\end{bmatrix} \]

<div id="with-adjacency" class="graph-holder"></div>
</div>

To split this graph into 2 communities, we first find the eigenvectors associated with the 2 eigenvalues of highest magnitude. We perform an eigendecomposition on \\( A \\) and find

<div class="latex-and-graph">

$$ \begin{aligned} 
    \lambda_1 &= 3.487 \\ \lambda_2 &= -2.165 \\ \lambda_3 &= -1.754 \\  &... \\ \lambda_8 &= -0.359 \\

 \left[\begin{array}{c|c}
    \\
    e_1  & e_2  \\
    \\
  \end{array}\right] &= \left[\begin{array}{cc} 
    0.2152 & -0.0402 \\
    0.2831 & -0.4225 \\
    0.4673 & 0.5095  \\
    0.3048 & 0.4454  \\
    0.3379 & -0.0522 \\
    0.2577 & -0.3079 \\
    0.4316 & 0.1571  \\
    0.4420 & -0.4896
\end{array}\right] 

\end{aligned} $$

<div id="with-eigendecomp" class="graph-holder"></div>
</div>

ASE allows us to view the vertices as points in \\(\mathbb R^2\\). To view the graph in a low-dimensional embedding (the spectral layout) and results from k-means clustering, click the binoculars.  After performing k-means clustering, we have two clusters with grey circle centroids and a boundary line.

Different spectral embeddings produce different communities. Click the binoculars below to see the embeddings and communities if the same graph was processed with LSE or nLSE.

<div class="side-by-side-graphs">
    <div id="laplacian-compare-1" class="graph-holder">Laplacian</div>
    <div id="laplacian-compare-2" class="graph-holder">Normalized Laplacian</div>
</div>

The laplacian-based embeddings are similar to each other, but noticeably different from the adjacency embedding. Both LSE and nLSE seem to split the graphs well, but the communities returned by ASE are fractured. This does not necessarily mean that nLSE or LSE are inherently a better choice than ASE. Priebe et al. <sup> [[1]](#sources) </sup> explain this well:


>   It is often the case that practitioners cluster the vertices of a graph—say, via K-means clustering composed with Laplacian spectral embedding—and pronounce the method as having performed either well or poorly based on whether the resulting clusters correspond well or poorly with some known or preconceived notion of “correct” clustering. Indeed, such a procedure may be used to compare two clustering methods and to pronounce that one works better (on the particular data under consideration). However, clustering is inherently ill-defined, as there may be multiple meaningful groupings, and two clustering methods that perform differently with respect to one notion of truth may in fact be identifying inherently different, but perhaps complementary, underlying structure.

In the upcoming sections we visualize some of the results from this paper. Below is a spectral graph clustering tool for testing how various embeddings perform differently on a built graph. Click near the node to begin. (Warning: the visualization may slow down when reaching a large number of nodes)

<div id="complete-tool" class="graph-holder"></div>

The Stochastic Block Model
--------------------------
The [Stochastic Block Model](https://en.wikipedia.org/wiki/Stochastic_block_model) (SBM) is a [popular](https://scholar.google.com/scholar?rlz=1C5CHFA_enUS874US874&um=1&ie=UTF-8&lr&cites=13665266760427536344) random graph model meant for sets of communities along with inter and intra-connections. For a set of \\( k \\) communities, we use the definition:

$$ \operatorname{SBM}(\vec v, \mathbf{P}) \\
 \begin{aligned} \vec{v} \in \mathbb{N}^k :&\ \vec{v}_i \text{ is the size of the } i^{th} \text{ community } \\ 
 \mathbf{P} \in [0, 1]^{k \times k}:&\ \mathbf{P}_{ij} \text{ is the probability of an edge between }\\ & \text{ vertices in communities } i \text{ and } j \end{aligned} $$

Some advantages of the SBM include a simple definition and robust sampling.

Consider the distribution:

$$ X_1 \sim \operatorname{SBM}\left(\begin{bmatrix} 60 \\ 60 \end{bmatrix}, \begin{bmatrix} 0.15 & 0.04 \\ 0.04 & 0.03 \end{bmatrix}\right) $$

This distribution produces graphs with two equally sized communities. One community is 5 times as dense as the other. A node in the sparser community is more likely to connect to the *other* community than its own. Use the visualization below to see which embedding is able to recover the true communities; click the magnifying glass to see the true communities.
<div id="x1-sample" class="graph-holder"></div>


If the spectral embedding is used, it becomes clear ASE is able to split the graph into the two communities easily. However, both laplacian-based embeddings give little ability to separate the red and green points in the low-dimensional space, so they struggle to find the communities. If these results were not replicated, the circle-arrow on the right can be clicked to generate another graph from this distribution. The results visualized in this article hold *generally*, so some graphs from the distribution may not give clear results.

Consider another SBM:

$$ X_2 \sim \operatorname{SBM}\left(\begin{bmatrix} 60 \\ 60 \end{bmatrix}, \begin{bmatrix} 0.050 & 0.013 \\ 0.013 & 0.051 \end{bmatrix}\right) $$

This distribution has two communities of equal size with each community having a small amount of within-block connections. However, both communities connect sparingly to each other, so there is hope we can recover the true communities.

<div id="x2-sample" class="graph-holder"></div>

Although ASE performed well for \\( X_1 \\) it performs poorly for \\( X_2 \\). Splitting the ASE plot into red and green points is difficult as there are many red and green points clustered together. Both LSE and nLSE give decent plots that can be split into a set of mostly green points and a set of mostly red points (the LSE plot can sometimes be poorly scaled with many points incredibly close together, nLSE does a good job at correcting this). The split will not be perfect, as perfect recovery of any statistical model is rare, but it is a decent estimate of the models communities, especially considering how sparse the graph is. If we sampled from a distribution with the same probability matrix as \\( X_2 \\) but a much higher vertex count, the split would be more apparent. The k-means clustering may struggle to do the best possible partition between red and green points, but if a good split is available there is hope a different clustering algorithm would perform well. To try again with another graph, use the circle-arrow on the right.

In general, ASE performs well on graphs sampled from \\( X_1 \\) but poorly on graphs sampled from \\( X_2 \\). LSE and nLSE give opposite results showing potential that the embeddings can both give different, yet meaningful, communities.

The "two-truths" phenomenon
---------------------------
Finally we come to the "two-truths" phenomenon first shown by Priebe et al. <sup> [[1]](#sources) </sup>. The authors were able to demonstrate a graph produced from diffusion MRI data that gave different, but meaningful, results based on whether ASE or nLSE was used (in the paper they refer to nLSE as LSE but this article made a distinction between the two). When using ASE the authors find communities of Gray and White matter. Gray and White matter connections exhibit core-periphery structure i.e. if modeled by an SBM with \\(\mathbf P=\begin{bmatrix} a & b \\\\ b & c \end{bmatrix}\\), \\( a \\) will be significantly higher than both \\( b \\) and \\( c \\) (see \\( X_1 \\)). When using nLSE the authors find communities of Left and Right matter. In this case an affinity structure is more appropriate with both \\( a \\) and \\( c \\) being significantly higher than \\( b \\) (see \\( X_2 \\)). To visualize a graph that exhibits behavior similar to diffusion MRI data, we use the probability matrix from figure 3 of the paper:

$$ X_3 \sim \operatorname{SBM} \left(\begin{bmatrix} 30 \\ 30 \\ 30 \\ 30 \end{bmatrix}, 
\begin{bmatrix} 
    0.020 & 0.044 & 0.002 & 0.009 \\ 
    0.044 & 0.115 & 0.010 & 0.042 \\
    0.002 & 0.010 & 0.020 & 0.045 \\
    0.009 & 0.042 & 0.045 & 0.117 \end{bmatrix}\right) $$

<div id="four-blocks" class="graph-holder"></div>

The spectral layout of this graph is noisier, but it should be apparent ASE does a relatively good job putting the red and brown points in a cluster while placing the green and purple in a different, somewhat overlapping, cluster. This matches the findings above as both the green and purple communities have very little within-block connectivity and relatively strong connections to the red and brown communities.

When looking at the nLSE plot, with some noticeable overlap, the green and red points are in a cluster while the purple and brown points are in another. Looking at \\(\mathbf P\\) we can split it us as:

$$\left[\begin{array}{cc|cc} 
    0.020 & 0.044 & 0.002 & 0.009 \\ 
    0.044 & 0.115 & 0.010 & 0.042 \\
    \hline
    0.002 & 0.010 & 0.020 & 0.045 \\
    0.009 & 0.042 & 0.045 & 0.117 \end{array}\right]$$

If we treat each block as its own community, and squash this to a two-block SBM we get the following SBM:

$$ X_4 \sim \operatorname{SBM}\left(\begin{bmatrix} 60 \\ 60 \end{bmatrix}, \left[\begin{array}{c|c} 
    0.050 & 0.013 \\
    \hline
    0.013 & 0.051 \end{array}\right]\right)
$$

\\(X_2 = X_4\\) which we showed earlier was best split with nLSE.

Although we have only illustrated the case from Priebe et al. <sup> [[1]](#sources) </sup>, the paper's conclusion is still clear: there are cases where different embeddings of the same graph will give distinct legitimate results, so researchers should not be so quick to discredit the results of an embedding on their data.

Sources
------

1. Carey E. Priebe, Youngser Park, Joshua T. Vogelstein, John M. Conroy,Vince Lyzinski, Minh Tang, Avanti Athreya, Joshua Cape, and Eric Bridge-ford. [On a two-truths phenomenon in spectral graph clustering](https://doi.org/10.1073/pnas.1814462116). *Proceedings of the National Academy of Sciences*, 116(13):5995–6000, 2019
2. Von Luxburg, U. (2007). [A tutorial on spectral clustering](https://arxiv.org/abs/0711.0189). *Statistics and computing*, 17(4), 395-416.

Appendix
--------
Code used to create the visualizations in this article can be found [here](https://github.com/SamGRosen/samgrosen.github.io/blob/master/assets/js/two-truths/).

As a starting point, I used *[Build Your Own Graph!](https://observablehq.com/@d3/build-your-own-graph)* to construct the visualizations.

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
    display: grid;
    grid-template-columns: 1fr 1fr;
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
