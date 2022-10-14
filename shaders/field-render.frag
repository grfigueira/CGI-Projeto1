precision highp float;

const int MAX_PLANETS = 10;
const float PI = 3.14159;
const float DENSITY = 5510.0;
const float GRAVITY_CONST = 6.67 * pow(10.0, -11.0);
const float PARTICLE_MASS = 1.0;
const float R_e = 6.371 * pow(10.0, 6.0);

varying vec2 fPosition;
uniform float uRadius[MAX_PLANETS];
uniform vec2 uPosition[MAX_PLANETS];

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 net_fVector = vec2(0.0, 0.0);
    for(int i = 0; i < MAX_PLANETS; i++){
        if(uRadius[i] > 0.0){
            vec2 forceVector = normalize(vec2(uPosition[i].x - fPosition.x, uPosition[i].y - fPosition.y));
            float distance = sqrt(pow((fPosition.x * R_e - uPosition[i].x * R_e), 2.0) + pow((fPosition.y * R_e - uPosition[i].y * R_e), 2.0));
            float radius = uRadius[i] * R_e;
            if(distance < radius){
                radius = distance;
            }
            float planetMass = (4.0 * PI * radius * radius * radius * DENSITY) / 3.0;
            float force = (GRAVITY_CONST * planetMass * PARTICLE_MASS) / pow(distance, 2.0);
            net_fVector += forceVector * force;
        }
    }
    float angle = atan(net_fVector.y, net_fVector.x) / (2.0 * PI);
    vec3 rgbColor = hsv2rgb(vec3(angle, 1.0, 1.0));
    float forceIntensity = sqrt((net_fVector.x * net_fVector.x) + (net_fVector.y*net_fVector.y));
    if(mod(log(forceIntensity) * 2.0, 1.0) < 0.1) {forceIntensity = 0.0;}
    //if(mod(log(forceIntensity) * 1.2, 0.4) < 0.08) {forceIntensity = 0.0;}
    gl_FragColor = vec4(rgbColor, forceIntensity);
}