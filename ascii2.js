// Attaches an event listener for each element of a class. Handlers should expect to take in an element
// @param className: name of class in which to attach a listener for handle
// @param handler: function to attach to each element
function attachListenersByClass(className, handler) {
    
}

$(document).ready(
    function() {
        // TODO: figure out how to fit this in Frame(). The problem is that the page needs to be loaded (i.e. ui needs to run) before connecting the tabs to event listeners.
        for(var i = 0; i < ui.f.length; ++i) {
            var tabs = (function(i) {return ui.f[i].window.getElementsByClassName('tab');})(i);
//            console.log(tabs);

            // TIL for loops don't have their own scope
            // Attach the event listeners for each tab
            for (var j = 0; j < tabs.length; ++j) {
                (function(j) {
                $(tabs[j]).on('click', function() {
//                    console.log(j);
                    ui.f[0].openTab(tabs[j]);
                });
                })(j);
            }
            
            // Attach the event listeners for each tool image
            var tools = (function(i) {return ui.f[i].window.getElementsByClassName('tool');})(i);
            for (var j = 0; j < tools.length; ++j) {
                (function(j) {
                $(tools[j]).on('click', function() {

                    ui.f[0].setMode(tools[j]);
                });
                })(j);
            }
//            console.log(ui.f[i].boxes);
            // Set up each box in the HTML
            for(b in ui.f[i].boxes) {
                var currBox = ui.f[i].boxes[b];
                currBox.bd.makeBox();
                currBox.bd.setArea();
        //        console.log(boxes[b]);
                
            }
        }
        
//        var tabs = ui.f[0].window.getElementsByClassName('tab');
//        $(tabs[0]).on('click', function() {
//            console.log(0);
//            ui.f[0].openTab(tabs[0].id);
//        });
//        $(tabs[1]).on('click', function() {
//            console.log(1);
//            ui.f[0].openTab(tabs[1].id);
//        });
        console.log("ascii2.js");
//        testCompiles();
    }
);
