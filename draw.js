//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| draw.js                                   |
//|     * functions to draw objects to screen |
//+-------------------------------------------+

var modelViewMatrix;
var projectionMatrix;
var normalViewMatrix;

function calculateMatrices() {
    modelViewMatrix = mult( translate(0,0,-distance), rotation );
    projectionMatrix = perspective(70, window.innerWidth / window.innerHeight, 0.1, 100.0);
    normalViewMatrix = normalMatrix(modelViewMatrix);
}

function drawCall(fbo,draw_function) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    draw_function();
    
    if ( fbo == null )
        return null;
    else
        return fbo.output;
}

function drawWave() {
    gl.depthMask(false);
    gl.useProgram( waveProgram );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    
    gl.vertexAttribPointer( wp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( wp_position );

    gl.bufferSubData( gl.ARRAY_BUFFER, 0, bufferWave );
    gl.drawArrays( gl.POINTS, 0, bufferWave.length / 2 );
    
    gl.disableVertexAttribArray( wp_position );
    gl.depthMask(true);
}
function drawCubes() {
    gl.useProgram(mirrorProgram);
    
    gl.uniformMatrix4fv(mp_projection, false, flatten(projectionMatrix) );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, cubeIndices );
    
    gl.vertexAttribPointer( mp_position, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( mp_position );
    
    var cubeColors = getCurrentlyPlaying();
    
    var reduce = 4.0;
    var count = outerSphere.audioElements / reduce;
    var radians = Math.PI * 4.0 / count;
    var rotval = radians;
    var maxh = outerSphere.audioTotal / 6.0;
    var radius = 3.0;
    
    console.log()
    
    for ( var wave=0.5;wave<count;wave++ ) {
        var i = Math.floor(wave);
        var coord = 2 * i * reduce;
        var h_color = outerSphere.bufferWave[coord+1] * 4.0;
        var h = outerSphere.bufferWave[coord+1] * maxh;
        
        function clamp(x, low, high) {
            if ( x < low )
                return low;
            else if ( x > high )
                return high;
            else
                return x;
        }
        
        var total = 0.0;
        var values = [1.0 - clamp(Math.abs(h_color-0.0), 0.0, 1.0),
                      1.0 - clamp(Math.abs(h_color-1.0), 0.0, 1.0),
                      1.0 - clamp(Math.abs(h_color-2.0), 0.0, 1.0),
                      1.0 - clamp(Math.abs(h_color-3.0), 0.0, 1.0)];
        for ( var j=0;j<values.length;j++ )
            total += values[j];
        for ( var j=0;j<values.length;j++ )
            values[j] = values[j] / total;
        
        var x = radius * Math.cos(rotval);
        var y =  - 2.5;
        var z = radius * Math.sin(rotval);
        var rot = rotate(rad2deg(rotval), vec3(0.0, -1.0, 0.0));
        
        for ( var j=0;j<h;j++ ) {
            var cubeModelView = mult( modelViewMatrix, mult( translate(x,y,z), mult( rot, scalem(0.05, 0.05, 0.05) ) ) );
            gl.uniformMatrix4fv(mp_model_view, false, flatten(cubeModelView) );
            
            if ( cubeColors < 0 ) {
                gl.uniform4f(mp_color, 1.0, 1.0, 1.0, 0.25);
            } else {
                var color = [0,0,0];
                var impulse = outerSphere.bufferImpulse[i * reduce];
                for ( var c=0;c<values.length;c++ ) {
                    color[0] += values[c] * ((1.0-impulse) * normalColors[cubeColors][c][0] + impulse * impulseColors[cubeColors][c][0]);
                    color[1] += values[c] * ((1.0-impulse) * normalColors[cubeColors][c][1] + impulse * impulseColors[cubeColors][c][1]);
                    color[2] += values[c] * ((1.0-impulse) * normalColors[cubeColors][c][2] + impulse * impulseColors[cubeColors][c][2]);
                }
                gl.uniform4f(mp_color, color[0], color[1], color[2], 0.05 + impulse * 0.20);
            }
            
            gl.drawElements( gl.TRIANGLE_STRIP, 14, gl.UNSIGNED_INT, 0 );
            y += 0.2;
        }
        
        rotval += radians;
        if ( Math.abs( rotval - Math.PI * 2.0 ) < 0.001 ) {
            rotval += radians / 2;
            radians = -radians;
        }
    }
    
    gl.disableVertexAttribArray( mp_position );
}
function drawMirror() {
    gl.useProgram(mirrorProgram);
    
    gl.uniform4f(mp_color, 1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
    
    var mirrorModelView = mult( modelViewMatrix, mult( translate(0,-3,0), scalem(5,1,5) ) );
    gl.uniformMatrix4fv(mp_model_view, false, flatten(mirrorModelView) );
    gl.uniformMatrix4fv(mp_projection, false, flatten(projectionMatrix) );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, mirrorBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, mirrorIndices );
    
    gl.vertexAttribPointer( mp_position, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( mp_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( mp_position );
}

function drawSphere(program, unifs, sphereDef, points) {
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(unifs.model_view, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(unifs.projection, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(unifs.normal_projection, false, flatten(normalViewMatrix) );
        
    gl.uniform3f(unifs.light_dir, 0.0, 0.7071, 0.7071);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereDef.vertex );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereDef.indices );
    
    gl.vertexAttribPointer( unifs.pos, 2, gl.FLOAT, false, 16, 0 );
    gl.enableVertexAttribArray( unifs.pos );
    
    gl.vertexAttribPointer( unifs.uv, 2, gl.FLOAT, false, 16, 8 );
    gl.enableVertexAttribArray( unifs.uv );
    
    if ( points ) {
        gl.drawArrays( gl.POINTS, 0, 2 + sphereDef.latBands * sphereDef.lonBands );
    } else {
        gl.drawElements( gl.TRIANGLES, 6 * sphereDef.latBands * sphereDef.lonBands, gl.UNSIGNED_INT, 0 );
    }
    
    gl.disableVertexAttribArray( unifs.pos );
    gl.disableVertexAttribArray( unifs.uv );
}

function drawBlurXPass(texture) {
    gl.depthMask(false);
    gl.useProgram( ppBlurXProgram );
    
    gl.uniform2f( pp_blurx_image_size, canvas.width, canvas.height );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, drawboxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, drawboxIndices );
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.vertexAttribPointer( pp_blurx_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_blurx_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_blurx_position );
    gl.depthMask(true);
}

function drawBlurYPass(texture) {
    gl.depthMask(false);
    gl.useProgram( ppBlurYProgram );
    
    gl.uniform2f( pp_blury_image_size, canvas.width, canvas.height );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, drawboxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, drawboxIndices );
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.vertexAttribPointer( pp_blury_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_blury_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_blury_position );
    gl.depthMask(true);
}

function drawFinalPass(original, post) {
    gl.depthMask(false);
    gl.useProgram( ppFinalProgram );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, drawboxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, drawboxIndices );
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, post);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, original);

    gl.vertexAttribPointer( pp_final_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_final_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_final_position );
    gl.depthMask(true);
}