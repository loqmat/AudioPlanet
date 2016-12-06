//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| resize.js                                 |
//|     * functions to call when the window   |
//|       is resized                          |
//+-------------------------------------------+

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width  = window.innerWidth;
    textCanvas.height = window.innerHeight;
    for (var i=0; i<songNames.length; i++)
        drawText ( songNames[i], i );
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}

function resizePostprocess() {
    var w = canvas.width;
    var h = canvas.height;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_main);
    gl.bindRenderbuffer(gl.RENDERBUFFER, pp_depth_buffer);
    gl.bindTexture(gl.TEXTURE_2D, pp_color_texture);
    
    pp_fbo_main.width = w;
    pp_fbo_main.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_color_texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pp_depth_buffer);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_blur_x);
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_x_texture);
    
    pp_fbo_blur_x.width = w;
    pp_fbo_blur_x.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_blur_x_texture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_blur_y);
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_y_texture);
    
    pp_fbo_blur_y.width = w;
    pp_fbo_blur_y.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_blur_y_texture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}