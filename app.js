paper.install(window);

window.onload = function() {
    paper.setup(document.getElementById('myCanvas'));
  // Initialize the layers
  window.backgroundLayer = new paper.Layer();
  window.pathsLayer = new paper.Layer();
  paper.project.activeLayer = window.pathsLayer;  // Set the active layer to pathsLayer
  


    // Variables
    // Declare slide as a global variable
    let slide;
    let tool = new Tool(slide);
    let path;
    let segment;
    let editMode = false;
    let selectMode = false;
    let selectedPath = null;
    let segmentIndicators = [];
    let animatedPath;
    let offset = 0;
    let pathThickness = 1;  // Default thickness value, you can change this to any desired value


// Set initial canvas dimensions
paper.view.viewSize = new paper.Size(document.getElementById('myCanvas').clientWidth, document.getElementById('myCanvas').clientHeight);

// Adjust canvas dimensions on window resize
window.addEventListener('resize', function() {
    paper.view.viewSize = new paper.Size(document.getElementById('myCanvas').clientWidth, document.getElementById('myCanvas').clientHeight);
});
    
    paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);


    window.setPathThickness = function(thickness) {
        if (selectedPath) {
            selectedPath.strokeWidth = thickness;
            paper.view.draw();  // Refresh the view to reflect the changes
        } else {
            pathThickness = thickness;
        }
    }
    
    

    window.toggleSelectMode = function() {
        selectMode = !selectMode;
        if (!selectMode && selectedPath) {
            clearBoundingBox(); // Clear the bounding box when exiting select mode
            selectedPath.selected = false;
            selectedPath = null;
        }
    }
    
 

    let boundingBox = null; // Variable to hold the bounding box

function showBoundingBox(targetPath) {
    if (targetPath) {
        clearBoundingBox(); // Clear any existing bounding box

        // Create a rectangle from the bounds of the selected path
        boundingBox = new paper.Path.Rectangle(targetPath.bounds);
        boundingBox.strokeColor = 'blue';
        boundingBox.strokeWidth = 2;
        boundingBox.dashArray = [10, 4];  // Dashed line style for the bounding box
    }
}

function clearBoundingBox() {
    if (boundingBox) {
        boundingBox.remove();
        boundingBox = null;
    }
}


    // Functions for Editing
    window.toggleEditMode = function() {
        editMode = !editMode;
        if (editMode && selectedPath) {
            showSegmentIndicators(selectedPath);
        } else {
            clearSegmentIndicators();
        }
    }

    function showSegmentIndicators(targetPath) {
        if (targetPath) {
            for (let seg of targetPath.segments) {
                let indicator = new paper.Path.Circle({
                    center: seg.point,
                    radius: 5,
                    fillColor: 'red',
                    data: { isSegmentIndicator: true }  // Tag the segment indicator
                });
                segmentIndicators.push(indicator);
            }
        }
    }
    
    function clearSegmentIndicators() {
        segmentIndicators.forEach(indicator => indicator.remove());
        segmentIndicators = [];
    }

    // Functions for Animation
    window.animatePath = function() {
        if (animatedPath) {
            animatedPath.remove();
        }
        offset = 0;
        let pathsToAnimate = paper.project.activeLayer.children.filter(child => child instanceof paper.Path && child !== animatedPath);
        animateNextPath(pathsToAnimate);
    }

    function animateNextPath(pathsToAnimate) {
        if (pathsToAnimate.length === 0) return;
        offset = 0;
        let currentPath = pathsToAnimate.shift();
        
        // Ensure the current path is not selected
        currentPath.selected = false;
    
        currentPath.strokeColor = 'transparent';
        animatedPath = new paper.Path();
        animatedPath.strokeColor = 'black';
        animatedPath.strokeWidth = currentPath.strokeWidth;
    
        paper.view.onFrame = function(event) {
            offset += 2;
            if (offset > currentPath.length) {
                paper.view.onFrame = null;
                animateNextPath(pathsToAnimate);
                return;
            }
            let point = currentPath.getPointAt(offset);
            animatedPath.add(point);
        };
    }
    

    // Functions for Path Simplification
    window.simplifyPath = function() {
        if (selectedPath) {
            selectedPath.simplify(2.5);
            if (editMode) {
                clearSegmentIndicators();
                showSegmentIndicators(selectedPath);
            }
        }
    }

    // Mouse events
    tool.onMouseDown = function(event) {
        if (editMode && selectedPath) {
            let segmentHitResult = selectedPath.hitTest(event.point, {
                segments: true,
                tolerance: 5
            });
            if (segmentHitResult && segmentHitResult.type === 'segment') {
                segment = segmentHitResult.segment;
                return;  // Exit early if we found a segment in edit mode
            }
        }
    
        let hitResult = paper.project.hitTest(event.point, {
            fill: true,
            stroke: true,
            tolerance: 5
        });
        
        // Check if the mouse clicked on a path but not on a segment indicator
        if (hitResult && hitResult.item instanceof paper.Path && !hitResult.item.data.isSegmentIndicator) {
            if (selectMode) {
                if (selectedPath) {
                    clearBoundingBox();
                    selectedPath.selected = false;
                }
                selectedPath = hitResult.item;
                showBoundingBox(selectedPath);
            }
        } else {
            // Mouse clicked on an empty area
            if (selectedPath) {
                clearBoundingBox();
                selectedPath.selected = false;
                selectedPath = null;
            }
            if (!editMode && !selectMode) {
                path = new paper.Path({
                    segments: [event.point],
                    strokeColor: 'black',
                    strokeWidth: pathThickness
                });
            }
        }
    }
    
    

    tool.onMouseDrag = function(event) {
        if (editMode && segment) {
            segment.point = segment.point.add(event.delta);  // Move the segment
            
            // Update the corresponding segment indicator's position
            let index = selectedPath.segments.indexOf(segment);
            if (index !== -1 && segmentIndicators[index]) {
                segmentIndicators[index].position = segment.point;
            }
        } else if (!editMode && !selectMode) {
            path.add(event.point);
        }
    }
    
    

    tool.onMouseUp = function (event) {
        createNewPath(event);
    };
    
    function createNewPath() {
        if (currentSlideIndex !== -1 && path) {
            // Store the path data in the current slide's 'paths' property
            slides[currentSlideIndex].paths.push(path.exportJSON());
    
            // Render the current slide to display the new path
            renderSlide(slides[currentSlideIndex]);
    
            path = null;  // Reset the path variable
        }
    }
    

    // Function to Save as SVG
    window.saveSVG = function() {
        if (selectedPath) {
            let svg = selectedPath.exportSVG({ asString: true });
            let blob = new Blob([svg], { type: "image/svg+xml" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "path.svg";
            a.click();
        }
    }

    window.deleteSelectedPath = function() {
        if (selectedPath) {
            // Remove segment indicators if in edit mode
            if (editMode) {
                clearSegmentIndicators();
            }
            
            // Remove the selected path from the canvas
            selectedPath.remove();
            
            // Clear the bounding box
            clearBoundingBox();
            
            // Reset the selected path reference
            selectedPath = null;
        }
    }
    
    
}/* End window onload */
