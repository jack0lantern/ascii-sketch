$(document).ready(
    function() {
        // TODO: figure out how to fit this in Frame(). The problem is that the page needs to be loaded (i.e. ui needs to run) before connecting the tabs to event listeners.
        for(var i = 0; i < ui.f.length; ++i) {
            var tabs = (function(i) {return ui.f[i].window.getElementsByClassName('tab');})(i);
            console.log(tabs);

            // TIL for loops don't have their own scope
            for (var j = 0; j < tabs.length; ++j) {
                (function(j) {
                var tempFunc = function() {
                    console.log(j);
                    ui.f[0].openTab(tabs[j].id);
                };
                $(tabs[j]).on('click', tempFunc);
                })(j);
            }
            
//            console.log(ui.f[i].boxes);
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
