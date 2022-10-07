precision mediump float;

uniform vec2 uScale; //(1.5, 1,5*canvaHeight/canvasWidth )

// Vertex position in World Coordinates
attribute vec2 vPosition;

varying vec2 fPosition;

void main() 
{
    fPosition = vPosition * uScale;
    gl_Position = vec4(vPosition, 0.0, 1.0);
}