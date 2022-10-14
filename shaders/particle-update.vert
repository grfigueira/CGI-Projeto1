precision highp float;

const int MAX_PLANETS = 10;
const float PI = 3.14159;
const float DENSITY = 5510.0;
const float GRAVITY_CONST = 6.67 * pow(10.0, -11.0);
const float PARTICLE_MASS = 1.0;
const float R_e = 6.371 * pow(10.0, 6.0);

/* Number of seconds (possibly fractional) that has passed since the last
   update step. */
uniform float uDeltaTime;

/* Inputs. These reflect the state of a single particle before the update. */


attribute vec2 vPosition;              // actual position
attribute float vAge;                  // actual age (in seconds)
attribute float vLife;                 // when it is supposed to die 
attribute vec2 vVelocity;              // actual speed

/* Outputs. These mirror the inputs. These values will be captured into our transform feedback buffer! */
varying vec2 vPositionOut;
varying float vAgeOut;
varying float vLifeOut;
varying vec2 vVelocityOut;

//Uniforms
uniform vec2 originPosition;
uniform float maxLife;
uniform float minLife;

uniform float uAlfa;
uniform float uBeta;

uniform float uVelMax;
uniform float uVelMin;

uniform float uRadius[MAX_PLANETS];
uniform vec2 uPosition[MAX_PLANETS];


// generates a pseudo random number that is a function of the argument. The argument needs to be constantly changing from call to call to generate different results
highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

void main() {

   /* Update parameters according to our simple rules.*/
   vPositionOut = vPosition + vVelocity * uDeltaTime;
   vAgeOut = vAge + uDeltaTime;
   vLifeOut = vLife;

   vec2 net_fVector = vec2(0.0, 0.0);
    for(int i = 0; i < MAX_PLANETS; i++){
        if(uRadius[i] > 0.0){
            if(pow((vPosition[0]- uPosition[i].x),2.0) + pow((vPosition[1] - uPosition[i].y),2.0) <= uRadius[i] * uRadius[i]){
                vAgeOut = vLife;
                break;
                }
            vec2 forceVector = vec2(uPosition[i].x - vPosition.x, uPosition[i].y - vPosition.y);
            float radius = uRadius[i] * R_e;
            float planetMass = (4.0 * PI * radius * radius * radius * DENSITY) / 3.0;
            float distance = sqrt(pow((vPosition.x * R_e - uPosition[i].x * R_e), 2.0) + pow((vPosition.y * R_e - uPosition[i].y * R_e), 2.0));
            float force = (GRAVITY_CONST * planetMass * PARTICLE_MASS) / pow(distance, 2.0);
            net_fVector += forceVector * force;
        }
    }

   vec2 accel = net_fVector / PARTICLE_MASS;
   vVelocityOut = vVelocity + accel * uDeltaTime;
      
   if (vAgeOut >= vLife) {
      vAgeOut = 0.0;
      vLifeOut = rand(vec2(rand(vPosition),rand(vec2(vAge,vLife)))) * (maxLife - minLife) + minLife;
      vPositionOut = originPosition;

      float angle = uAlfa + rand(vec2(vAge, rand(vec2(vAge,vLifeOut)))) * 2.0 * uBeta - uBeta ;

      float velDif = uVelMax - uVelMin;
      float currVel = uVelMin + rand(vec2(rand(vec2(vAge,vLife)),rand(vPosition))) * velDif;
      vVelocityOut = vec2(cos(angle) * currVel, sin(angle) * currVel);
   }

}