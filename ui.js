//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| main.js                                   |
//|     * functions for drawing and managing  |
//|       the UI                              |
//+-------------------------------------------+

var boxes = [];
var songNames = [];

function getCurrentlyPlaying() {
    for (var j=0; j<boxes.length; j++) {
        if (boxes[j][5]) {
            if (! (audioNodes[j].audioNode.paused))
                return j;
        }
    }
    return -1;
}

function drawBox() {
    gl.depthMask(false);
    gl.useProgram( boxProgram ); 
    gl.uniform4f( bp_color,1,1,1,0.2 );

    gl.bindBuffer( gl.ARRAY_BUFFER, progressBarBuffer );
    gl.vertexAttribPointer( bp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( bp_position );
    
    var playing = getCurrentlyPlaying();
        
    for (var i=0; i<boxes.length; i++) {
        if (boxes[i][5]) {
            var x = boxes[i][0];
            var y = boxes[i][1];
            var w = boxes[i][2];
            var h = boxes[i][3];

            var boxProjection = ortho (0, canvas.width, canvas.height, 0, 0, 1);
            gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
            var boxModelView = translate(0,0,0);
            gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 
            
            var progressBarArray = progressBar ( i );
            if ( progressBarArray ) {
                var color;
                if (playing>=0) {
                    if (i%2) { //odd number
                        color = normalColors[playing][(i-1)/2]
                    } else {
                        color = impulseColors[playing][(i)/2]  
                    }
                    gl.uniform4f( bp_color,color[0],color[1],color[2],0.2 ); 
                }  
                gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(progressBarArray) );
                gl.drawArrays( gl.TRIANGLE_STRIP, 0, flatten(progressBarArray).length/2);
            }
        }
    }

    gl.uniform4f( bp_color,1,1,1,0.5 );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.vertexAttribPointer( bp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( bp_position );

    for (var i=0; i<boxes.length; i++) {
        var x = boxes[i][0];
        var y = boxes[i][1];
        var w = boxes[i][2];
        var h = boxes[i][3];

        var boxProjection = ortho (0, canvas.width, canvas.height, 0, 0, 1);
        gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
        var boxModelView = mult( translate( x,y,0 ), scalem(w,h,1) );
        gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 

        var col;
        if (playing>=0) {
            if (i%2) { //odd number
                col = normalColors[playing][(i-1)/2]
            } else {
                col = impulseColors[playing][(i)/2]  
            }
            gl.uniform4f( bp_color,col[0],col[1],col[2],0.7 ); 
        }  
        gl.drawArrays( gl.LINE_LOOP, 0, 6 );
    }


    gl.disableVertexAttribArray( bp_position );
    gl.depthMask(true);
}

function boxClick( num ) {  //takes in the index of the box that was clicked
    if ( boxes[num][5] == null ) {
        var fopen = document.getElementById("loadFile");
        fopen.onchange = function(event) {
            console.log (URL.createObjectURL(fopen.files[0]));
            var audioNode = createAudioNode( URL.createObjectURL(fopen.files[0]));
            boxes[num][5] = audioNode;
            audioNode.makeCurrent();
            var songName = fopen.files[0].name.substring(0,fopen.files[0].name.length-4);
            songNames.push ( songName );
            drawText( songName, num );
            if ( boxes.length < 6 ) {
                boxes.push( [15 + 175*((num+1)%2), 15*(num+2) + 90*(num+1), 200, 180, boxClick, null] );
            }
            
            gl.useProgram(sphereInnerProgram);
            gl.uniform3fv(sip.nrm_gradient_colors, flatten(normalColors[num]));
            gl.uniform3fv(sip.imp_gradient_colors, flatten(impulseColors[num]));
            
            gl.useProgram(sphereOuterProgram);
            gl.uniform3fv(sop.nrm_gradient_colors, flatten(normalColors[num]));
            gl.uniform3fv(sop.imp_gradient_colors, flatten(impulseColors[num]));
        }
        fopen.click();  
    }   
    else {
        boxes[num][5].makeCurrent();
        
        gl.useProgram(sphereInnerProgram);
        gl.uniform3fv(sip.nrm_gradient_colors, flatten(normalColors[num]));
        gl.uniform3fv(sip.imp_gradient_colors, flatten(impulseColors[num]));
        
        gl.useProgram(sphereOuterProgram);
        gl.uniform3fv(sop.nrm_gradient_colors, flatten(normalColors[num]));
        gl.uniform3fv(sop.imp_gradient_colors, flatten(impulseColors[num]));
    }
}

function progressBar ( num ) {
    var progress = audioNodes[ num ].audioNode.currentTime / audioNodes[ num ].audioNode.duration;

    var x = boxes[ num ][0];
    var y = boxes[ num ][1];
    var w = boxes[ num ][2];
    var h = boxes[ num ][3];

    var ang = Math.atan( (h/2)/(w/4) )

    if ( progress < .0001 || !progress ) {
        return null;
    } else if ( progress <= 0.25 ) { 
        return [ vec2( x + (progress*w), y + (0.5*h-(progress*w*Math.tan(ang))) ), 
        vec2( x , y + 0.5*h ),
        vec2( x + (progress*w), y + 0.5*h ),
        vec2( x + (progress*w), y + (0.5*h+(progress*w*Math.tan(ang))) ) ];

    } else if ( progress > 0.25 && progress <=0.75 ) {
        return [ vec2( x , y + 0.5*h ),
        vec2( x + ( 0.25*w ), y ), 
        vec2( x + ( 0.25*w ), y + h ),
        vec2( x + (progress*w), y ),
        vec2( x + (progress*w), y + h ) ];
    } else {
        return [ vec2( x , y + 0.5*h ),
        vec2( x + ( 0.25*w ), y ), 
        vec2( x + ( 0.25*w ), y + h ),
        vec2( x + (0.75*w), y ),
        vec2( x + (0.75*w), y + h ),
        vec2( x + (progress*w), y + (0.5*h - ((w-progress*w)*Math.tan(ang))) ),
        vec2( x + (progress*w), y + (0.5*h + ((w-progress*w)*Math.tan(ang))) )
         ];
    }
}

function drawText ( name, num ) {
    var ctx = textCanvas.getContext('2d');
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillText(name, 30 + 175*((num)%2), 15*(num+2) + 90*(num+1) -10, 170 );
}