paper.install(window);

window.onload = function() {
    paper.setup(document.getElementById('myCanvas'));

    // Variables
    let tool = new Tool();
    let path;
    let segment;
    let editMode = false;
    let selectMode = false;
    let selectedPath = null;
    let segmentIndicators = [];
    let animatedPath;
    let offset = 0;

    // Functions for Selection
    window.toggleSelectMode = function() {
        selectMode = !selectMode;
        if (selectedPath) {
            selectedPath.selected = false;
            selectedPath = null;
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
                    fillColor: 'red'
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
        if (selectMode) {
            let hitResult = paper.project.hitTest(event.point, {
                fill: true,
                stroke: true,
                tolerance: 5
            });
            if (hitResult && hitResult.item instanceof paper.Path) {
                if (selectedPath) {
                    selectedPath.selected = false;
                }
                selectedPath = hitResult.item;
                selectedPath.selected = true;
            }
        } else if (editMode && selectedPath) {
            let hitResult = selectedPath.hitTest(event.point, {
                segments: true,
                tolerance: 5
            });
            if (hitResult && hitResult.type === 'segment') {
                segment = hitResult.segment;
            }
        } else {
            path = new paper.Path({
                segments: [event.point],
                strokeColor: 'black'
            });
        }
    }

    tool.onMouseDrag = function(event) {
        if (editMode && segment) {
            segment.point = segment.point.add(event.delta);
            let index = selectedPath.segments.indexOf(segment);
            if (index !== -1 && segmentIndicators[index]) {
                segmentIndicators[index].position = segment.point;
            }
        } else if (!editMode && !selectMode) {
            path.add(event.point);
        }
    }

    tool.onMouseUp = function(event) {
        segment = null;
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
}
