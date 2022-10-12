import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { vec2, vec3, flatten, subtract, dot } from '../../libs/MV.js';

// Buffers: particles before update, particles after update, quad vertices
let inParticlesBuffer, outParticlesBuffer, quadBuffer;

// Particle system constants

// Total number of particles
const N_PARTICLES = 100000;
const MAX_BODIES = 10;

let drawPoints = true;
let drawField = true;


let currentMouse = vec2(0.0, 0.0);
let originParticles = vec2(0.0, 0.0);

let vMin = 0.1;
let vMax = 0.2;

let aAlpha = 0; 
let aBeta = Math.PI*2;

let vLifeMin = 2;
let vLifeMax = 10;

let cursorPosInit = currentMouse;
let cursorPosEnd = currentMouse;
let planets = [];
let editingPlanet = false;

let time = undefined;

function main(shaders)
{
    // Generate the canvas element to fill the entire page
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    /** type {WebGL2RenderingContext} */
    const gl = setupWebGL(canvas, {alpha: true});

    // Initialize GLSL programs    
    const fieldProgram = buildProgramFromSources(gl, shaders["field-render.vert"], shaders["field-render.frag"]);
    const renderProgram = buildProgramFromSources(gl, shaders["particle-render.vert"], shaders["particle-render.frag"]);
    const updateProgram = buildProgramFromSources(gl, shaders["particle-update.vert"], shaders["particle-update.frag"], ["vPositionOut", "vAgeOut", "vLifeOut", "vVelocityOut"]);

    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable Alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

    buildQuad();
    buildParticleSystem(N_PARTICLES);

    window.addEventListener("resize", function(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0,0,canvas.width, canvas.height);
    });


    window.addEventListener("keydown", function(event) {
        console.log(event.key);
        switch(event.key) {
            case "PageUp":
                if(event.shiftKey){
                    if (vMax>vMin)
                        vMin+=0.1;
                }
                else{
                    vMax+=0.1;
                }
                break;
            case "PageDown":
                if(event.shiftKey){
                    if(vMin>0.1)
                        vMin-=0.1;
                }
                else{
                    if(vMax>vMin)
                        vMax-=0.1;
                }
                break;
            case "ArrowUp":
                if (aBeta < Math.PI*2)
                aBeta+= Math.PI/30;
                break;
            case "ArrowDown":
                if (aBeta > Math.PI/30)
                aBeta-= Math.PI/30;
                break;
            case "ArrowLeft":
                aAlpha+= Math.PI/30;
                break;
            case "ArrowRight":
                aAlpha-= Math.PI/30;
                break;
            case 'q':
                if(vLifeMin < 19 && vLifeMin != vLifeMax)
                    vLifeMin ++;
                break;
            case 'a':
                if (vLifeMin > 1)
                    vLifeMin --;
                break;
            case 'w':
                if(vLifeMax < 20)
                    vLifeMax ++;
                break;
            case 's':
                if (vLifeMax > 2 && vLifeMax != vLifeMin)
                    vLifeMax --;
                break;
            case '0':
                drawField = !drawField;
                break;
            case '9':
                drawPoints  = !drawPoints;
                break; 
            case 'Shift':
                break;

        }
    });


    canvas.addEventListener("mousedown", function(event) {
        cursorPosInit = getCursorPosition(canvas, event);
        addPlanet(distanceTwoPoints(cursorPosInit, cursorPosInit));
        editingPlanet = true;
    });

    canvas.addEventListener("mousemove", function(event) {
        const p = getCursorPosition(canvas, event);
        if(event.shiftKey){
            originParticles = getCursorPosition(canvas,event);
        }
        if(editingPlanet){
            cursorPosEnd = getCursorPosition(canvas, event);
            planets[planets.length - 1][2] = distanceTwoPoints(cursorPosInit, cursorPosEnd);
        }
        currentMouse = getCursorPosition(canvas,event);
       // console.log(p);
    });

    canvas.addEventListener("mouseup", function(event) {
        editingPlanet = false;
        cursorPosEnd = getCursorPosition(canvas, event);
        console.log(distanceTwoPoints(cursorPosInit, cursorPosEnd));
    })

    function distanceTwoPoints(p1, p2){
        return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    }
    
    function getCursorPosition(canvas, event) {
  
       
        const mx = event.offsetX;
        const my = event.offsetY;

        const x = (((mx / canvas.width * 2) - 1)*1.5);
        const y = (((canvas.height - my)/canvas.height * 2) -1);

        return vec2(x,y);
    }

    window.requestAnimationFrame(animate);

    function buildQuad() {
        const vertices = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
                          -1.0, 1.0,  1.0, -1.0, 1.0,  1.0];
        
        quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    }

    function addPlanet(planetRadius){
        planets.push(vec3(cursorPosInit, planetRadius));
        console.log("Added planet " + planets);
    }

    function buildParticleSystem(nParticles) {
        const data = [];

        for(let i=0; i<nParticles; ++i) {
            // position
            const x = Math.random() * 1.5 * 2 - 1.5
            const y = Math.random() * 1.0 * 2 - 1.0;

            data.push(x); data.push(y);
            
            // age
            data.push(0.0);

            // life
            const life = Math.random() * 5;
            //const life = Math.random() * (vLifeMax-vLifeMin) + vLifeMin;
            data.push(life);

            // velocity
            let angle = Math.random() * 2.0 * Math.PI;
            let velocity = Math.random() * 0.15;
            // data.push(Math.sin(angle) * velocity);
            // data.push(Math.cos(angle) * velocity);
            data.push(0.0);
            data.push(0.0);
        }

        inParticlesBuffer = gl.createBuffer();
        outParticlesBuffer = gl.createBuffer();

        // Input buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, inParticlesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STREAM_DRAW);

        // Output buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, outParticlesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STREAM_DRAW);
    }



    function animate(timestamp)
    {
        // console.log("Max life : " + vLifeMax);
        // console.log("Min life : " + vLifeMin);
        // console.log("Beta: " + aBeta);
        // console.log("Alpha: " + aAlpha);
        // console.log("vMax: " + vMax);
        // console.log("vMin: " + vMin);

        let deltaTime = 0;

        if(time === undefined) {        // First time
            time = timestamp/1000;
            deltaTime = 0;
        } 
        else {                          // All other times
            deltaTime = timestamp/1000 - time;
            time = timestamp/1000;
        }

        window.requestAnimationFrame(animate);

        // Clear framebuffer
        gl.clear(gl.COLOR_BUFFER_BIT);

        if(drawField) drawQuad();
        updateParticles(deltaTime);
        if(drawPoints) drawParticles(outParticlesBuffer, N_PARTICLES);

        swapParticlesBuffers();
    }

    function updateParticles(deltaTime)
    {


        // Setup uniforms
        const uDeltaTime = gl.getUniformLocation(updateProgram, "uDeltaTime");

        gl.useProgram(updateProgram);

        gl.uniform1f(uDeltaTime, deltaTime);
        
        // Setup attributes
        const vPosition = gl.getAttribLocation(updateProgram, "vPosition");
        const vAge = gl.getAttribLocation(updateProgram, "vAge");
        const vLife = gl.getAttribLocation(updateProgram, "vLife");
        const vVelocity = gl.getAttribLocation(updateProgram, "vVelocity");


        //Uniforms
        const originPosition = gl.getUniformLocation(updateProgram,"originPosition");
        gl.uniform2fv(originPosition,originParticles);

        for(let i = 0; i < planets.length; i++) {
            const uPosition = gl.getUniformLocation(updateProgram, "uPosition[" + i + "]");
            const uRadius = gl.getUniformLocation(updateProgram, "uRadius[" + i + "]");
            let position = vec2(planets[i][0], planets[i][1]);
            gl.uniform2fv(uPosition, position);
            gl.uniform1f(uRadius, planets[i][2]);
        }

        const maxLife = gl.getUniformLocation(updateProgram, "maxLife");
        gl.uniform1f(maxLife,vLifeMax);
        const minLife = gl.getUniformLocation(updateProgram, "minLife");
        gl.uniform1f(minLife,vLifeMin);
        const randomNum = gl.getUniformLocation(updateProgram, "randomNum");
        gl.uniform1f(randomNum, Math.random()*deltaTime);

        const uAlfa = gl.getUniformLocation(updateProgram, "uAlfa");
        gl.uniform1f(uAlfa,aAlpha);
        const uBeta = gl.getUniformLocation(updateProgram, "uBeta");
        gl.uniform1f(uBeta,aBeta);

        const uVelMin = gl.getUniformLocation(updateProgram, "uVelMin");
        gl.uniform1f(uVelMin,vMin);
        const uVelMax = gl.getUniformLocation(updateProgram, "uVelMax");
        gl.uniform1f(uVelMax,vMax);



        

        gl.bindBuffer(gl.ARRAY_BUFFER, inParticlesBuffer);
        
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(vAge, 1, gl.FLOAT, false, 24, 8);
        gl.vertexAttribPointer(vLife, 1, gl.FLOAT, false, 24, 12);
        gl.vertexAttribPointer(vVelocity, 2, gl.FLOAT, false, 24, 16);
        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vAge);
        gl.enableVertexAttribArray(vLife);
        gl.enableVertexAttribArray(vVelocity);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outParticlesBuffer);
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, N_PARTICLES);
        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    function swapParticlesBuffers()
    {
        let auxBuffer = inParticlesBuffer;
        inParticlesBuffer = outParticlesBuffer;
        outParticlesBuffer = auxBuffer;
    }

    function drawQuad() {

        gl.useProgram(fieldProgram);

        const uScale = gl.getUniformLocation(fieldProgram, "uScale");
        gl.uniform2f(uScale, 1.5, 1.5*canvas.height/canvas.width);
        for(let i = 0; i < planets.length; i++) {
            const uPosition = gl.getUniformLocation(fieldProgram, "uPosition[" + i + "]");
            const uRadius = gl.getUniformLocation(fieldProgram, "uRadius[" + i + "]");
            let position = vec2(planets[i][0], planets[i][1]);
            gl.uniform2fv(uPosition, position);
            gl.uniform1f(uRadius, planets[i][2]);
        }

        // Setup attributes
        const vPosition = gl.getAttribLocation(fieldProgram, "vPosition"); 

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(vPosition);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function drawParticles(buffer, nParticles)
    {

        gl.useProgram(renderProgram);

        const uScale = gl.getUniformLocation(renderProgram, "uScale");
        gl.uniform2f(uScale, 1.5, 1.5*canvas.height/canvas.width);


        // Setup attributes
        const vPosition = gl.getAttribLocation(renderProgram, "vPosition");

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.POINTS, 0, nParticles);
    }
}


loadShadersFromURLS([
    "field-render.vert", "field-render.frag",
    "particle-update.vert", "particle-update.frag", 
    "particle-render.vert", "particle-render.frag"
    ]
).then(shaders=>main(shaders));