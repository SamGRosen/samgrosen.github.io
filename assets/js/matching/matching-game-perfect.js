    
// let drawMoves = SVG().addTo("#possible-moves").size("100%", "15em");

function addPreviewGradient(draw, color) {
    let grad =  draw.gradient('linear', function(add) {
        add.stop(0.05, '#999')
        add.stop(0.85, color)
    });
    grad.attr({
        gradientTransform: "rotate(90)",

    })
    return grad;
}

// const grad = addPreviewGradient(drawMoves);

// drawMoves.rect(100, 100).move(20, 20).fill(grad)

function drawCardsPerfect(draw, cards) {
    const numberOfPairs = cards.length / 2
    const cardWidth = (100 - cards.length) / numberOfPairs;
    const cardGap = 2;
    const unFlippedFill = "#999"
    const rowOne = draw.group();
    const rowTwo = draw.group();

    let currentlyMatching = undefined;
    let currentlyMatchingRect = undefined;
    let currRow = rowOne;
    let numberOfPairsRemaining = numberOfPairs;

    for(let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let rect = currRow.rect(`${cardWidth}%`, "40%")
        rect.fill(unFlippedFill)
        rect.addClass("matching-game")

        rect.click(function(e) {
            rect.fill(addPreviewGradient(draw, card.color));

            if (this.hasClass("completed") || currentlyMatching === card) {
                return;
            }
            

            if(currentlyMatching !== undefined) {
                increaseMoveCounterPerfect();

                if(currentlyMatching.color === card.color) { // correctly matched
                    currentlyMatchingRect.addClass("completed")
                    currentlyMatchingRect.addClass("flipped")
                    this.addClass("completed")
                    this.addClass("flipped")
                    this.fill({color: card.color})

                    currentlyMatching = undefined;
                    currentlyMatchingRect = undefined;
                    numberOfPairsRemaining -= 1;

                } else { // failed match
                    this.addClass("flipped");
                    this.fill({color: card.color});

                    setTimeout(() => {
                        this.removeClass("flipped")
                        this.fill(addPreviewGradient(draw, card.color))
                        currentlyMatchingRect.removeClass("flipped")
                        currentlyMatchingRect.fill(addPreviewGradient(draw, currentlyMatching.color))
                        currentlyMatching = undefined;
                        currentlyMatchingRect = undefined;
                    }, 750)
                }
            } else { // first part of turn
                currentlyMatching = card;
                currentlyMatchingRect = this;
                

                this.fill({color: card.color});
                this.addClass("flipped");
            }
        });

        rect.dx(`${(i % numberOfPairs) * (cardWidth + cardGap)}%`)

        rect.dy(`${currRow === rowTwo ? 50 + cardGap : 0}%`)
        if(i == numberOfPairs - 1) {
            currRow = rowTwo;
        }
    }
}


function increaseMoveCounterPerfect() {
    currMoves = parseInt(document.getElementById('moves-perfect').innerHTML);
    document.getElementById('moves-perfect').innerHTML = currMoves + 1;
}

let drawPerfect = undefined;
function newGamePerfect(numberOfPairs) {
    if(drawPerfect !== undefined) {
        drawPerfect.remove();
    }
    
    drawPerfect = SVG().addTo("#game-perfect").size("100%", "15em");
    const cards = generateCards(numberOfPairs);

    drawCardsPerfect(drawPerfect, cards);
}

function newGameButtonClickPerfect() {
    let numPairs = document.getElementById("pairs-perfect").value;
    newGamePerfect(numPairs);
    document.getElementById('moves-perfect').innerHTML = 0;
}

// https://stackoverflow.com/questions/155188/trigger-a-button-click-with-javascript-on-the-enter-key-in-a-text-box
document.getElementById("pairs-perfect")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        newGameButtonClickPerfect();
    }
});

newGamePerfect(5);