paper.install(window);
window.onload = function() {
    paper.setup(document.getElementById('myCanvas'));

    let tool = new Tool();
    let path;
    let segment;  // Variable to hold the segment being dragged
    let editMode = false;  // Flag to indicate whether we're in edit mode

    function showSegmentIndicators() {
        if (path) {
            for (let seg of path.segments) {
                let indicator = new paper.Path.Circle({
                    center: seg.point,
                    radius: 5,
                    fillColor: 'red'
                });
            }
        }
    }

    tool.onMouseDown = function(event) {
        if (editMode) {
            if (path) {
                let hitResult = path.hitTest(event.point, {
                    segments: true,
                    tolerance: 5
                });

                if (hitResult && hitResult.type === 'segment') {
                    segment = hitResult.segment;
                }
            }
        } else {
            if (path) {
                path.selected = false;  // Deselect the current path
            }
            path = new paper.Path();
            path.strokeColor = 'black';
            path.add(event.point);
        }
    }

    tool.onMouseDrag = function(event) {
        if (editMode && segment) {
            // Move the segment
            segment.point = segment.point.add(event.delta);
    
            // Update the corresponding segment indicator's position
            let index = path.segments.indexOf(segment);
            if (index !== -1 && segmentIndicators[index]) {
                segmentIndicators[index].position = segment.point;
            }
        } else if (!editMode) {
            path.add(event.point);
        }
    }
    

    tool.onMouseUp = function(event) {
        segment = null;  // Reset segment on mouse up
    }

    let segmentIndicators = [];  // Array to store segment indicators

function showSegmentIndicators() {
    if (path) {
        for (let seg of path.segments) {
            let indicator = new paper.Path.Circle({
                center: seg.point,
                radius: 5,
                fillColor: 'red'
            });
            segmentIndicators.push(indicator);
        }
    }
}

    window.toggleEditMode = function() {
        editMode = !editMode;
        if (editMode) {
            showSegmentIndicators();
        } else {
            // Remove segment indicators when exiting edit mode
            segmentIndicators.forEach(indicator => indicator.remove());
            segmentIndicators = [];  // Reset the segmentIndicators array
        }
    }
    

    window.saveSVG = function() {
        let svg = path.exportSVG({asString: true});
        let blob = new Blob([svg], {type: "image/svg+xml"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "path.svg";
        a.click();
    }

    let animatedPath; // Declare it outside to access it across calls
    let pathsToAnimate; // Array to store paths that need to be animated
    let offset = 0;    // Starting offset for the animation
    
    window.animatePath = function() {
        // Remove previous animated path if it exists
        if (animatedPath) {
            animatedPath.remove();
        }
    
        // Reset offset
        offset = 0;
    
        // Get all paths on the canvas
        pathsToAnimate = paper.project.activeLayer.children.filter(child => child instanceof paper.Path && child !== animatedPath);
        
        // Start the animation sequence
        animateNextPath();
    }
    
    
    function animateNextPath() {
        // Check if there are paths left to animate
        if (pathsToAnimate.length === 0) return;
    
        // Reset for the new path
        offset = 0;
        let currentPath = pathsToAnimate.shift(); // Get the next path and remove it from the array
        currentPath.strokeColor = 'transparent';
        
        animatedPath = new paper.Path();
        animatedPath.strokeColor = 'black';
        animatedPath.strokeWidth = currentPath.strokeWidth;
    
        paper.view.onFrame = function(event) {
            offset += 2;  // Controls the speed of the animation. Adjust as needed.
            if (offset > currentPath.length) {
                paper.view.onFrame = null;  // Stop the onFrame loop for the current path
                animateNextPath();  // Recursively call to animate the next path
                return;
            }
            let point = currentPath.getPointAt(offset);
            animatedPath.add(point);
        };
    }
    

    window.simplifyPath = function() {
        if (path) {
            path.simplify(2.5);  // The value is the tolerance; adjust as needed
            if (editMode) {
                // Clear existing segment indicators
                segmentIndicators.forEach(indicator => indicator.remove());
                segmentIndicators = [];
                // Show new segment indicators for the simplified path
                showSegmentIndicators();
            }
        }
    }
    
} //end window.onload
