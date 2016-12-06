//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| main.js                                   |
//|     * initialization functions            |
//|     * define main loop                    |
//+-------------------------------------------+

var gl;
var canvas;

var displayPoints = false;
var applyPostProcess = true;
var glowPasses = 1;

var rotquat = [1,0,0,0]; // 1 + i + j + k
var distance = 4;
var rotation = translate(0,0,0);

// Global Functions
function initWindow() {
    canvas = document.getElementById( "GLCanvas" );
    textCanvas = document.getElementById( "TextCanvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) alert( "WebGL isn't available" );
    
    initGL();
    initAudio();
    initInputs();
}

function initInputs() {
    var mouseDown = false;

    document.onmousedown = function(e) {
        if ( e.which == 1 )
            mouseDown = true;
    }
    document.onwheel = function(e) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        distance = Math.max( 1.5, Math.min(10, distance - delta / 10.0));
    }
    
    document.addEventListener('mousedown', function(event) {
        console.log(event);
        if ( event.which == 1 ) {
            var gothit = false;
            for (var i = 0; i < boxes.length; i++) {
                var pointx = Math.abs(event.x - (boxes[i][0] + (boxes[i][2]/2.0)) );        
                var pointy = Math.abs(event.y - (boxes[i][1] + (boxes[i][3]/2.0)) );

                if ( !(pointx > (boxes[i][2]/2.0) || pointy > (boxes[i][3]/2.0)) ||
                     ((boxes[i][3]/2.0) * (boxes[i][2]/2.0) - (boxes[i][3]/2.0) * pointx - (boxes[i][2]/2.0) * pointy >= 0) )
                {
                    gothit = true;
                    boxes[i][4]( i );
                    console.log ("box:", i);
                }
            }
            mouseDown = !gothit;
        }
    });
    document.addEventListener('mouseup', function(event) {
        if ( event.which == 1 )
            mouseDown = false;
    });
    document.addEventListener('mousemove', function(event) {
        if ( mouseDown ) {
            var dx = scaleValue(event.movementX, 18.0, 18.0);
            var dy = scaleValue(event.movementY, 18.0, 18.0);
            
            var qx = rotate(rad2deg(dx), vec3(0.0, 1.0, 0.0));
            var qy = rotate(rad2deg(dy), vec3(1.0, 0.0, 0.0));
            var qr = mult( qx, qy );
            
            rotation = mult( rotation, qr );
        }
    });
    document.addEventListener('resize', function() {
        resizeCanvas();
        resizePostprocess();
    });
    document.addEventListener('keydown', function(event) {
        if ( event.keyCode == 32 ) {
            displayPoints = !displayPoints;
        } else if ( event.keyCode == 80 ) {
            applyPostProcess = !applyPostProcess;
        } else if ( event.key == "ArrowUp" ) {
            glowPasses ++ ;
        } else if ( event.key == "ArrowDown" ) {
            glowPasses = Math.max( 0, glowPasses - 1 );
        } else {
            console.log(event);
        }
    });
}
function initAudio() {
    function renderFrame() {
        window.requestAnimationFrame(renderFrame);
        
        if ( audioCurrentNode != null ) {
            audioCurrentNode.getTimeDomainData(innerSphere.audioFrequencyData);
            audioCurrentNode.getFrequencyData(outerSphere.audioFrequencyData);
        }
        
        processAudio(sphereInnerProgram, sip, innerSphere);
        processAudio(sphereOuterProgram, sop, outerSphere);
    }
    
    renderFrame();
}

function initGL() {
    //  Configure WebGL
    resizeCanvas();
    setupGLParams();
    setupBoxBuffer();
    setupBoxProgram();
    setupWaveProgram();
    setupMirror();
    setupCube();
    setupSphereProgram();
    setupPostprocess();
    resizePostprocess();
    
    boxes.push( [15, 15, 200, 180, boxClick, null] );

    function runProgram() {
        calculateMatrices();
        
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.blendFunc(gl.ONE, gl.ZERO);
        drawCall(pp_fbo_main, function() {
            //drawSphere(sphereInnerProgram, sip, innerSphere, false);
            drawSphere(sphereOuterProgram, sop, outerSphere, displayPoints);
            drawCubes();
            //drawMirror();
        });
        if ( applyPostProcess ) {
            drawCall(pp_fbo_blur_x, function() {
                drawBlurXPass(pp_color_texture);
            });
            drawCall(pp_fbo_blur_y, function() {
                drawBlurYPass(pp_blur_x_texture);
            });
            for ( var i=0;i<glowPasses;i++ ) {
                drawCall(pp_fbo_blur_x, function() {
                    drawBlurXPass(pp_blur_y_texture);
                });
                drawCall(pp_fbo_blur_y, function() {
                    drawBlurYPass(pp_blur_x_texture);
                });
            }
        }
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        drawCall(null, function() {
            if ( applyPostProcess )
                drawFinalPass(pp_color_texture, pp_blur_y_texture);
            else
                drawFinalPass(pp_color_texture, null);
            drawBox();
        });
        
        window.requestAnimationFrame(runProgram);
    }
    
    runProgram();
}

window.onload = initWindow;