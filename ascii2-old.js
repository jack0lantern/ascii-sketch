

$(document).ready(
    function() {
        // TODO: figure out how to fit this in Frame(). The problem is that the page needs to be loaded (i.e. ui needs to run) before connecting the tabs to event listeners.
        for(var i = 0; i < ui.f.length; ++i) {
            ui.f[i].attachFrameListeners();
            
            // Set up each box in the HTML
            for(b in ui.f[i].boxes) {
                var currBox = ui.f[i].boxes[b];
//                currBox.makeBox();
            }
        }

        log("ascii2.js");
//        testCompiles();
    }
);
