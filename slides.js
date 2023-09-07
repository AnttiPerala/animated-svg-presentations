let slides = [];
window.currentSlideIndex = -1;
// At the top of your slides.js file, add these global layer variables:



function updateSlideNumberDisplay() {
    let slideNumberElement = document.getElementById("slideNumber");
    slideNumberElement.textContent = `Slide: ${currentSlideIndex + 1} / ${slides.length}`;
}

function createNewSlide() {
    let newSlide = {
        paths: []
    };
    slides.push(newSlide);
    currentSlideIndex = slides.length - 1;
    renderSlide(slides[currentSlideIndex]);
    navigateSlide(currentSlideIndex);
    updateSlideNumberDisplay();
}

function navigateSlide(direction) {
    if (direction === 1 && currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
    } else if (direction === -1 && currentSlideIndex > 0) {
        currentSlideIndex--;
    }
    renderSlide(slides[currentSlideIndex]);
    updateSlideNumberDisplay();
}

function renderSlide(slide) {
    if (!slide) return;

    // Clear the canvas
    paper.project.clear();

    // Re-establish layers after clearing
    backgroundLayer = new paper.Layer();
    pathsLayer = new paper.Layer();

    // Set background image if it exists
    if (slide.backgroundImage) {
        document.getElementById('slideContainer').style.backgroundImage = `url(${slide.backgroundImage})`;
    } else {
        document.getElementById('slideContainer').style.backgroundImage = '';
    }

    // Display text content
    if (slide.textContent) {
        let text = new paper.PointText({
            point: paper.view.center,
            content: slide.textContent,
            fillColor: 'black',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontSize: 25
        });
        text.position.y -= 50;
    }

    // Render paths
    paper.project.activeLayer = pathsLayer;  // Use pathsLayer for drawing paths
    renderPathsOnSlide();
}

function renderPathsOnSlide() {
    if (slides[currentSlideIndex] && slides[currentSlideIndex].paths) {
        for (let pathData of slides[currentSlideIndex].paths) {
            let path = new paper.Path();
            path.importJSON(pathData);
            path.onFrame = function (event) {
                // Add animation logic if needed
            };
        }
    }
}


function renderPathsOnSlide() {
    pathsLayer.removeChildren();

    if (slides[currentSlideIndex] && slides[currentSlideIndex].paths) {
        for (let pathData of slides[currentSlideIndex].paths) {
            let path = new paper.Path();
            path.importJSON(pathData);
            path.onFrame = function(event) {
                // Add animation logic if needed
            };
        }
    }
}


function setBackgroundImage() {
    let input = document.getElementById('bgImageInput');
    let file = input.files[0];

    if (file) {
        let imageName = file.name;
        let imagePath = 'img/' + imageName;

        // Store the image path in the current slide's object
        if (slides[currentSlideIndex]) {
            slides[currentSlideIndex].backgroundImage = imagePath;

            // Set the background image on the canvasContainer
            document.getElementById('slideContainer').style.backgroundImage = `url(${imagePath})`;
        }
    }
}


/* Save  */

function saveSlideshowAsJSON() {
    const jsonString = JSON.stringify(slides);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "slideshow.json";
    a.click();
}

/* restore */

function handleJSONInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSlides = JSON.parse(e.target.result);
                if (Array.isArray(importedSlides)) {
                    slides = importedSlides;
                    currentSlideIndex = 0;
                    renderSlide(slides[currentSlideIndex]);
                    updateSlideNumberDisplay();
                } else {
                    alert("Invalid JSON structure.");
                }
            } catch (error) {
                alert("Error parsing JSON.");
            }
        };
        reader.readAsText(file);
    }
}

function restoreSlideshowFromJSON() {
    document.getElementById('jsonInput').click();
}

window.removeBackgroundImage = function() {
    console.log("Attempting to remove background image...");
    console.log(slides[currentSlideIndex]);

    if (currentSlideIndex !== -1) {
        console.log("Current slide index:", currentSlideIndex);
        if (slides[currentSlideIndex].backgroundImage) {
            console.log("Found background image. Removing...");
            delete slides[currentSlideIndex].backgroundImage;
            document.getElementById('slideContainer').style.backgroundImage = '';
            renderSlide(slides[currentSlideIndex]);
        } else {
            console.log("No background image found on current slide.");
        }
    } else {
        console.log("No active slide.");
    }
};
