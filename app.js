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
let pathMovedDuringSelect = false;
let existingPathDragged = false;
let boundingBox = null; // Variable to hold the bounding box
let hitResult;


window.onload = function () {
    paper.setup(document.getElementById('myCanvas'));
    // Initialize the layers
    window.pathsLayer = new paper.Layer();
    paper.project.activeLayer = window.pathsLayer;  // Set the active layer to pathsLayer

    document.getElementById('animationSpeedSlider').addEventListener('input', function () {
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
    window.addEventListener('resize', function () {
        paper.view.viewSize = new paper.Size(document.getElementById('myCanvas').clientWidth, document.getElementById('myCanvas').clientHeight);
    });

    paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);


    window.setPathThickness = function (thickness) {
        if (selectedPath) {
            selectedPath.strokeWidth = thickness;
            paper.view.draw();  // Refresh the view to reflect the changes
        } else {
            pathThickness = thickness;
        }
    }


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
    window.toggleEditMode = function () {
        editMode = !editMode;
        if (editMode) {
            drawMode = false; // Disable drawMode
            selectMode = false;
            document.querySelector("#drawTool").classList.remove("active");
            document.querySelector("#selectTool").classList.remove("active");
            document.querySelector("#editTool").classList.add("active");
            showSegmentIndicators(selectedPath);
            console.log('editmode', editMode );
            console.log('selectmode', selectMode );
            console.log('drawmode', drawMode );
        } else {
            clearSegmentIndicators();
            document.querySelector("#editTool").classList.remove("active");
        }
    }

    window.toggleSelectMode = function () {
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
            for (let i = 0; i < targetPath.segments.length; i++) {
                let seg = targetPath.segments[i];
                let indicator = new paper.Path.Circle({
                    center: seg.point,
                    radius: 5,
                    fillColor: 'red',
                    data: {
                        isSegmentIndicator: true,
                        segmentIndex: i,  // store the segment index in the data
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
    window.animatePath = function () {
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

        paper.view.onFrame = function (event) {
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
    window.simplifyPath = function () {
        if (selectedPath) {
            selectedPath.simplify(2.5);
            if (editMode) {
                clearSegmentIndicators();
                showSegmentIndicators(selectedPath);
            }
        }
    }


    // Mouse events
    tool.onMouseDown = function (event) {
        console.log("Mouse down detected");
    
        pathCreated = false;  // Reset the flag
    
        hitResult;
        
        // If in editMode, prioritize segment check
        if (editMode) {
            let hitOptions = {
                segments: true,
                stroke: true,
                fill: true,
                tolerance: 15
            };
            hitResult = paper.project.hitTest(event.point, hitOptions);
        
            if (hitResult && hitResult.item && hitResult.item.data.isSegmentIndicator) {
                let segmentIndex = hitResult.item.data.segmentIndex;  // get the segment's index from the indicator's data
                segment = selectedPath.segments[segmentIndex];  // Set the segment to the corresponding segment of the path
                console.log("Selected segment:", segment);
            }
        }
        
    
        // If we haven't returned by now, check for other interactions
        hitResult = paper.project.hitTest(event.point, {
            fill: true,
            stroke: true,
            tolerance: 5
        });

        // Determine if the click is within the bounding box of the selected path
        if (selectedPath && selectedPath.bounds.contains(event.point)) {
            initialClickPoint = event.point;  // Store the initial click point for movement calculations
            return;  // Exit early to keep the selection and prepare for potential movement
        }



        if (hitResult && hitResult.item instanceof paper.Path && !hitResult.item.data.isSegmentIndicator) { //clicked on path
            if (selectMode) {
                //if it was selected, deselect
                if (selectedPath) {
                    clearBoundingBox();
                    selectedPath.selected = false;
                } else {
                  selectedPath = hitResult.item;
                showBoundingBox(selectedPath);  
                }
                
            }
        } else {
            // Mouse clicked on an empty area, de-select path
            if (selectedPath) {
                clearBoundingBox();
                selectedPath.selected = false;
                selectedPath = null;
            }
            if (drawMode) {
                path = new paper.Path({
                    segments: [event.point],
                    strokeColor: 'black',
                    strokeWidth: pathThickness,
                    data: {
                        animationSpeed: animationSpeed,
                        animationOrder: animationOrder
                    }
                });
                isNewPath = true;  // Set the flag to true when a new path is started
      

            }
        }
        console.log('mousedown paper children', paper.project.activeLayer.children);

    }

    tool.onMouseDrag = function (event) {
        isDragging = true;
        console.log("onMouseDrag triggered");
        console.log("editMode:", editMode);
        console.log("selectMode:", selectMode);
        console.log("drawMode:", drawMode);
        //console.log("Selected segment:", segment);
    
     // Handle segment dragging in edit mode

     if (editMode && segment) {
        console.log("Dragging segment in editMode");
    
        segment.point = segment.point.add(event.delta);  // Adjust the segment's point
    
        // Check if hitResult and its properties exist before accessing them
        if (hitResult && hitResult.item && hitResult.item.data && hitResult.item.data.segmentIndex !== undefined) {
            // Update the corresponding segment indicator's position using its stored index
            let indicator = segmentIndicators[hitResult.item.data.segmentIndex];
            indicator.position = segment.point;
        }

    // Refresh the view to reflect the changes
    paper.view.draw();

    return;  // Return early to prevent other actions from happening
}
    
        // Handle movement of the selected path in select mode
        if (selectMode && selectedPath) {
            console.log("Dragging entire path in selectMode");
            pathMovedDuringSelect = true;
            pathMoved = true;
            pathCreated = false;
            let moveVector = event.point.subtract(initialClickPoint);
            selectedPath.position = selectedPath.position.add(moveVector);
            showBoundingBox(selectedPath);
            initialClickPoint = event.point;
            return;
        }
    
        // If you're in draw mode, add points to the path
        if (drawMode) {
            console.log("Adding points to path in drawMode");
            path.add(event.point);
        }
    }
    
    

    tool.onMouseUp = function (event) {
        isDragging = false;
        initialClickPoint = null;  // Reset the initial click point after the drag operation
    
        if (drawMode && path && !pathMoved) {
            console.log("Finished drawing. Current path before storing:", path);
            updatePathInCurrentSlide(path);
            pathCreated = true;
        } else if (selectMode && selectedPath && path !== selectedPath) { 
            console.log("Finished drawing. Current path before storing:", selectedPath);
            updatePathInCurrentSlide(selectedPath);
            selectedPath = null; // Clear the selectedPath
        } else if (editMode && segmentDragged) {
            // Handle segment dragging logic here, if any specific logic is required on mouse up.
            // You can also include any functions or methods you've previously used to handle segment dragging.
        }
        
        // Reset the flags for future operations
        pathCreated = false;
        pathMoved = false;  // Reset the pathMoved flag
        pathMovedDuringSelect = false;  // Reset the flag
        existingPathDragged = false;
        segmentDragged = false; // Reset the segmentDragged flag
    
        console.log('mouseup paper children', paper.project.activeLayer.children);
    };
    
    

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
    window.saveSVG = function () {
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

    window.deleteSelectedPath = function () {
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

    window.updateAnimationSpeed = function (value) {
        currentAnimationSpeed = parseFloat(document.getElementById('animationSpeedInput').value);
        if (selectedPath) {
            selectedPath.data.animationSpeed = currentAnimationSpeed;  // Store the animation speed in the path's data
        }
    };

    window.updateAnimationOrder = function (value) {
        if (selectedPath) {
            selectedPath.animationOrder = parseInt(value, 10);
        }
    };

    window.updateAnimationSpeedDisplay = function () {
        let speedValue = document.getElementById('animationSpeedSlider').value;

        document.getElementById('animationSpeedDisplay').textContent = speedValue;

        if (selectedPath) {
            selectedPath.data.animationSpeed = parseFloat(speedValue);

        } else {
            animationSpeed = parseFloat(speedValue);  // default for new paths
        }
    }

    function updatePathInCurrentSlide(updatedPath) {
        console.log('Updating path in current slide', updatedPath);
        console.log("updatePathInCurrentSlide - paper children:", paper.project.activeLayer.children.length);

        pathUpdated = true;
        if (currentSlideIndex !== -1) {
            let pathIndex = slides[currentSlideIndex].paths.findIndex(pathData => {
                let testPath = new paper.Path();
                testPath.importJSON(pathData);
                return testPath.id === updatedPath.id;
            });
    
            console.log('Path index found:', pathIndex);  // Log the path index
    
            if (pathIndex !== -1) {
                console.log("Updating existing path");
                slides[currentSlideIndex].paths[pathIndex] = updatedPath.exportJSON({asString: false});
                console.log("Stored path after update:", slides[currentSlideIndex].paths[pathIndex]);  // Check the stored path after updating
            } else if (isNewPath) {  // Only add if it's a new path
                console.log("Adding new path");
                slides[currentSlideIndex].paths.push(updatedPath.exportJSON({asString: false}));
                isNewPath = false;  // Reset the flag
                isFinishedDrawing = false;  // Reset this flag as well

                console.log("Stored path after addition:", slides[currentSlideIndex].paths[slides[currentSlideIndex].paths.length - 1]);  // Check the stored path after addition
            } else {
                console.log('isNewPath flag is true. Not adding path.');
            }
        }
    }
    

    window.toggleDrawMode = function () {
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
