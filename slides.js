let slides = [];

window.currentSlideIndex = -1;

let currentSlide = null;  // Initialize the currentSlide variable


function updateSlideNumberDisplay() {
    let slideNumberElement = document.getElementById("slideNumber");
    slideNumberElement.textContent = `Slide: ${currentSlideIndex + 1} / ${slides.length}`;
}

// Function to create a new slide
function createNewSlide() {
    let newSlide = {
        backgroundImage: null,
        textContent: '',
        paths: []  // Initialize the 'paths' property as an empty array
    };

    slides.push(newSlide);
    currentSlide = newSlide;  // Set the current slide to the newly created slide

    renderSlide(newSlide);
    updateSlideNumberDisplay();
}



function navigateSlide(direction) {
    if (direction === 1 && currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
    } else if (direction === -1 && currentSlideIndex > 0) {
        currentSlideIndex--;
    }
    renderSlide(slides[currentSlideIndex]); // Update the slide display
    updateSlideNumberDisplay(); // Update the slide number display
}





function renderSlide(slide) {
    if (!slide) return;  // Exit if slide is undefined or null

    // Clear the canvas
    paper.project.clear();

    // Set background image if it exists
    if (slide.backgroundImage) {
        let raster = new paper.Raster(slide.backgroundImage);
        raster.position = paper.view.center;  // center the image
        raster.size = paper.view.size;  // resize to fit the view
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
        text.position.y -= 50;  // Adjust the Y position a bit upwards
    }

    // Render paths
    renderPathsOnSlide();
}


// Function to render paths on the current slide
function renderPathsOnSlide() {
    // Clear the canvas
    paper.project.activeLayer.removeChildren();

    if (slides[currentSlideIndex]) {
        // Iterate over the paths associated with the current slide
        for (let pathData of slides[currentSlideIndex].paths) {
            let path = new paper.Path();
            path.importJSON(pathData);
            // Render the path on the canvas
            path.onFrame = function (event) {
                // Add animation logic if needed
            };
        }
    }
}