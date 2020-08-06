const exampleGraph = () => getStartingInfoFor([
    [0, 1, 1, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 1],
    [0, 1, 0, 0, 1, 0, 0, 1],
    [0, 0, 0, 1, 0, 0, 1, 1],
    [0, 0, 1, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 1, 1, 0, 1],
    [0, 0, 1, 1, 1, 0, 1, 0]])

const withAdjacency = new StartingGraphView("#with-adjacency", exampleGraph(), controls = []);
withAdjacency.initializeOntoDOM()

const withEigendecomp = new StartingGraphView("#with-eigendecomp", exampleGraph(), controls = ["spectral"]);
withEigendecomp.initializeOntoDOM()

const laplacianCompare1 = new StartingGraphView("#laplacian-compare-1", exampleGraph(), controls = ["spectral"], startingStyle = 1);
const laplacianCompare2 = new StartingGraphView("#laplacian-compare-2", exampleGraph(), controls = ["spectral"], startingStyle = 2);
laplacianCompare1.initializeOntoDOM()
laplacianCompare2.initializeOntoDOM();


const completeTool = new StartingGraphView("#complete-tool");
completeTool.initializeOntoDOM();

// X_1 sample for ASE
const X1 = () => sampleSBM([60, 60],
    [[.15, .04],
    [.04, .03]]);
const x1Sample = new GeneratingGraphView("#x1-sample",
    generator = X1,
    controls = ["spectral", "embedding", "refit", "showTruth", "generate"])
x1Sample.initializeOntoDOM();

// X_2 sample for LSE
const X2 = () => sampleSBM([60, 60],
    [[.050, .013],
    [.013, .051]])
const x2Sample = new GeneratingGraphView("#x2-sample",
    generator = X2,
    controls = ["spectral", "embedding", "refit", "showTruth", "generate"])
x2Sample.initializeOntoDOM();


// Four block model
const fourBlockGenerator = () => sampleSBM([30, 30, 30, 30],
    [[.02, .044, .002, .009],
    [.044, .115, .01, .042],
    [.002, .01, .02, .045],
    [.009, .042, .045, .117],
    ])

const fourBlocks = new GeneratingGraphView("#four-blocks",
    generator = fourBlockGenerator,
    controls = ["spectral", "embedding", "refit", "showTruth", "generate"],
)
fourBlocks.initializeOntoDOM();