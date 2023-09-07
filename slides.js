let slides = [];
window.currentSlideIndex = -1;

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

    // Set background image if it exists
    if (slide.backgroundImage) {
        let raster = new paper.Raster(slide.backgroundImage);
        raster.position = paper.view.center;
        raster.size = paper.view.size;
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
    renderPathsOnSlide();
}

function renderPathsOnSlide() {
    // Clear the canvas
    paper.project.activeLayer.removeChildren();

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
