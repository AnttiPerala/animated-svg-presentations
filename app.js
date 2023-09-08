paper.install(window);

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
    let animationSpeed = 1;
    let animationOrder = 1;
    let initialClickPoint = null;  // Store the initial point of mouse down for rotation
    let isDragging = false;
    let pathCreated = false;  // Add this at the beginning of the window.onload function
    let isNewPath = false;
    let pathUpdated = false;  // Flag to check if a path was updated during dragging
    let drawMode = true;
    let pathMoved = false;  // Flag to check if a path was moved during dragging
    let pathUpdatedDuringDrag = false;
    let pathMovedDuringSelect = false;
    let existingPathDragged = false;



window.onload = function() {
    paper.setup(document.getElementById('myCanvas'));
  // Initialize the layers
  window.backgroundLayer = new paper.Layer();
  window.pathsLayer = new paper.Layer();
  paper.project.activeLayer = window.pathsLayer;  // Set the active layer to pathsLayer

  document.getElementById('animationSpeedSlider').addEventListener('input', function() {
    let speedValue = this.value;
    document.getElementById('animationSpeedDisplay').textContent = speedValue;
    console.log("Setting animation speed to:", speedValue);

    if (selectedPath) {
        selectedPath.data.animationSpeed = parseFloat(speedValue);
    } else {
        animationSpeed = parseFloat(speedValue);  // default for new paths
    }
});

  
  // Initialize with one slide if there are no slides
  if (slides.length === 0) {
    createNewSlide();
}







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
    
    

/*     window.toggleSelectMode = function() {
        console.log("select tool click");
        selectMode = !selectMode;
        if (!selectMode && selectedPath) {
            clearBoundingBox(); // Clear the bounding box when exiting select mode
            selectedPath.selected = false;
            selectedPath = null;
            document.querySelector("#drawTool").classList.remove("active");
        } 

        if (!selectMode){
            console.log('select mode activated');
            document.querySelector("#drawTool").classList.add("active");
        }
    
    } */
 

    let boundingBox = null; // Variable to hold the bounding box

    function showBoundingBox(targetPath) {
        if (targetPath) {
            clearBoundingBox(); // Clear any existing bounding box
    
            // Create a rectangle from the bounds of the selected path
            boundingBox = new paper.Path.Rectangle(targetPath.bounds);
            boundingBox.strokeColor = 'blue';
            boundingBox.strokeWidth = 2;
            boundingBox.dashArray = [10, 4];  // Dashed line style for the bounding box
            boundingBox.data.boundingBox = true;  // This tags the path as a bounding box
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
        if (editMode) {
            drawMode = false; // Disable drawMode
            showSegmentIndicators(selectedPath);
        } else {
            clearSegmentIndicators();
        }
    }
    
    window.toggleSelectMode = function() {
        selectMode = !selectMode;
        if (selectMode) {
            console.log("Select mode activated");
            drawMode = false; // Disable drawMode
            document.querySelector("#drawTool").classList.remove("active");
            document.querySelector("#selectTool").classList.add("active");


            if (selectedPath) {
                clearBoundingBox();
                selectedPath.selected = false;
                selectedPath = null;
            }
        } else {
            document.querySelector("#selectTool").classList.remove("active");
        }
    }
    

    function showSegmentIndicators(targetPath) {
        if (targetPath) {
            for (let seg of targetPath.segments) {
                let indicator = new paper.Path.Circle({
                    center: seg.point,
                    radius: 5,
                    fillColor: 'red',
                    data: { 
                        isSegmentIndicator: true,
                        boundingBox: true  // This tags the segment indicators as bounding boxes too, to prevent their animation
                    }
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
        let pathsToAnimate = paper.project.activeLayer.children.filter(child => 
            child instanceof paper.Path && 
            child !== animatedPath &&
            child !== animatedPath &&  // Exclude the animated path
            (!child.data || !child.data.boundingBox)  // Ensure we don't animate bounding boxes or segment indicators
        );
        
        // Check if the path has animationSpeed defined, else set a default value
        pathsToAnimate.forEach(p => {
            if (!p.data || p.data.animationSpeed === undefined) {
                if (!p.data) p.data = {};
                p.data.animationSpeed = 2;  // You can set this to your default speed
            }
        });

        pathsToAnimate.forEach(p => {
            console.log("Path animation speed:", p.data.animationSpeed);
        });
        
    
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
    
        // Use the animation speed from the path's data, or a default value if not set
        let speed = currentPath.data && currentPath.data.animationSpeed ? currentPath.data.animationSpeed : 2;
    
        paper.view.onFrame = function(event) {
            offset += speed;
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
    pathCreated = false;  // Reset the flag

    // Check for path selection or de-selection
    let hitResult = paper.project.hitTest(event.point, {
        fill: true,
        stroke: true,
        tolerance: 5
    });

    // Determine if the click is within the bounding box of the selected path
    if (selectedPath && selectedPath.bounds.contains(event.point)) {
        initialClickPoint = event.point;  // Store the initial click point for movement calculations
        return;  // Exit early to keep the selection and prepare for potential movement
    }

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
        // Mouse clicked on an empty area, de-select path
        if (selectedPath) {
            clearBoundingBox();
            selectedPath.selected = false;
            selectedPath = null;
        }
        if (drawMode && !editMode && !selectMode) {
            isNewPath = true;
            pathCreated = true;
            path = new paper.Path({
                segments: [event.point],
                strokeColor: 'black',
                strokeWidth: pathThickness,
                data: {
                    animationSpeed: animationSpeed,
                    animationOrder: animationOrder
                }
            });
        }
    }
}


tool.onMouseDrag = function(event) {
    isDragging = true;

    // Handle movement of the selected path
    if (selectMode && selectedPath) {
        pathMovedDuringSelect = true;
        pathMoved = true;
        pathCreated = false;
        let moveVector = event.point.subtract(initialClickPoint);
        selectedPath.position = selectedPath.position.add(moveVector);
        showBoundingBox(selectedPath);
        initialClickPoint = event.point;
        return;
    }


    // Handle segment dragging in edit mode
    if (editMode && segment) {
        segment.point = segment.point.add(event.delta);  // Move the segment
        
        // Update the corresponding segment indicator's position
        let index = selectedPath.segments.indexOf(segment);
        if (index !== -1 && segmentIndicators[index]) {
            segmentIndicators[index].position = segment.point;
        }
    }
    
    // Check if we're dragging a selected path in select mode
    if (selectMode && selectedPath && !editMode) {
        updatePathInCurrentSlide(selectedPath);
    }
        else if (!editMode && !selectMode && drawMode && path) {  
            path.add(event.point);
        }
}

tool.onMouseUp = function(event) {
    isDragging = false;
    initialClickPoint = null;  // Reset the initial click point after the drag operation

    if (selectedPath) {
        updatePathInCurrentSlide(selectedPath);
    }

    // Only call createNewPath if in drawMode, a path was actually created, not updated during drag, and not moved
    if (pathCreated && drawMode && !existingPathDragged) {
        createNewPath(event);
    }
    // Reset the flags for future operations
    pathUpdatedDuringDrag = false;
    pathCreated = false;
    pathMoved = false;  // Reset the pathMoved flag
    pathMovedDuringSelect = false;  // Reset the flag
    existingPathDragged = false;


}


function setAnimationOrder() {
    if (selectedPath) {
        selectedPath.animationOrder = parseInt(document.getElementById('animationOrderInput').value);
    } else {
        // If no path is selected, set a global animation order for future paths
        animationOrder = parseInt(document.getElementById('animationOrderInput').value);  
    }
}

function createNewPath(event) {
    if (currentSlideIndex !== -1 && path) {
        // Generate a unique identifier (timestamp)
        let uniqueId = Date.now().toString();

        // Store the unique identifier in the path's data
        path.data.uniqueId = uniqueId;

        // Check if a path with the same unique identifier already exists
        let existingPathIndex = slides[currentSlideIndex].paths.findIndex(pathData => {
            let testPath = new paper.Path();
            testPath.importJSON(pathData);
            return testPath.data.uniqueId === uniqueId;
        });

        // Only add the path if it doesn't already exist
        if (existingPathIndex === -1) {
            slides[currentSlideIndex].paths.push(path.exportJSON());
        } else {
            console.warn("Path with unique ID already exists. Skipping addition.");
        }

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


    let currentAnimationSpeed;  // more descriptive name

    window.updateAnimationSpeed = function(value) {
        currentAnimationSpeed = parseFloat(document.getElementById('animationSpeedInput').value);
        if (selectedPath) {
            selectedPath.data.animationSpeed = currentAnimationSpeed;  // Store the animation speed in the path's data
        } 
    };
    
    window.updateAnimationOrder = function(value) {
        if (selectedPath) {
            selectedPath.animationOrder = parseInt(value, 10);
        }
    };

    window.updateAnimationSpeedDisplay = function() {
        let speedValue = document.getElementById('animationSpeedSlider').value;

        document.getElementById('animationSpeedDisplay').textContent = speedValue;
    
        if (selectedPath) {
            selectedPath.data.animationSpeed = parseFloat(speedValue);

        } else {
            animationSpeed = parseFloat(speedValue);  // default for new paths
        }
    }
    
    function updatePathInCurrentSlide(updatedPath) {
        pathUpdated = true;
        if (currentSlideIndex !== -1) {
            let pathIndex = slides[currentSlideIndex].paths.findIndex(pathData => {
                let testPath = new paper.Path();
                testPath.importJSON(pathData);
                return testPath.id === updatedPath.id;
            });
    
            if (pathIndex !== -1) {
                slides[currentSlideIndex].paths[pathIndex] = updatedPath.exportJSON();
            } else if (!isNewPath) {  // Only add if it's not a new path
                slides[currentSlideIndex].paths.push(updatedPath.exportJSON());
            }
        }
    }
    
    

    window.toggleDrawMode = function() {
        drawMode = !drawMode;
        if (drawMode) {
            console.log("Draw mode activated.");
            document.querySelector("#drawTool").classList.add("active");
            document.querySelector("#selectTool").classList.remove("active");
        } else {
            console.log("Draw mode deactivated.");
            document.querySelector("#drawTool").classList.remove("active");
        }
    }
    
    
    
}/* End window onload */
