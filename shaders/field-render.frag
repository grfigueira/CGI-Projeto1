precision highp float;

const int MAX_PLANETS = 10;

varying vec2 fPosition;
uniform vec3 uPlanets[MAX_PLANETS];

void main() {
    
    gl_FragColor = vec4(mod(fPosition.x, 1.0), mod(fPosition.y, 1.0), 0.0, 1.0);
    //gl_FragColor = vec4(uPlanets[0][0], uPlanets[0][0], 0.0, 1.0);
}