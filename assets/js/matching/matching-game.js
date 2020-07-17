// https://stackoverflow.com/a/6274381/10013298
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateCard(color) {
    return {
        color: color,
        // isFlipped: false, This was exported to css
    };
}

function generateCards(numPairs) {
    const cards = [];
    for(let i = 0; i < numPairs; i++) {
        let colorCode = Math.floor(Math.random()*16777215).toString(16)
        if(colorCode.length < 6) { // needs to be 6 characters or svg.js struggles
            colorCode = colorCode.padStart(6, "0")
        }
        const randomColor = "#" + colorCode; 
        cards.push(generateCard(randomColor), generateCard(randomColor))
    }
    return shuffle(cards);
}

function drawCards(draw, cards) {
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
        rect.fill({color: unFlippedFill});
        rect.addClass("matching-game")
        
        rect.click(function(e) {
            if (this.hasClass("completed") || currentlyMatching === card) {
                return;
            }
            

            if(currentlyMatching !== undefined) {
                increaseMoveCounter();

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
                        this.fill({color: unFlippedFill})
                        currentlyMatchingRect.removeClass("flipped")
                        currentlyMatchingRect.fill({color: unFlippedFill})
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


function increaseMoveCounter() {
    currMoves = parseInt(document.getElementById('moves').innerHTML);
    document.getElementById('moves').innerHTML = currMoves + 1;
}

let draw = undefined;
function newGame(numberOfPairs) {
    if(draw !== undefined) {
        draw.remove();
    }
    
    draw = SVG().addTo("#game").size("100%", "15em");
    const cards = generateCards(numberOfPairs);

    drawCards(draw, cards);
}

function newGameButtonClick() {
    let numPairs = document.getElementById("pairs").value;
    newGame(numPairs);
    document.getElementById('moves').innerHTML = 0;
}

// https://stackoverflow.com/questions/155188/trigger-a-button-click-with-javascript-on-the-enter-key-in-a-text-box
document.getElementById("pairs")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        newGameButtonClick();
    }
});

newGame(5);
