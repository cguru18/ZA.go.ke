import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, Color } from 'ogl';

const vertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 offset;
    attribute vec4 random;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float uTime;
    uniform float uStarSpeed;
    uniform vec2 uMouse;
    uniform float uRepulsion;
    uniform float uDensity;

    varying vec4 vRandom;
    varying vec3 vPosition;

    void main() {
        vRandom = random;
        
        // Galaxy movement logic
        float angle = random.x * 6.28 + uTime * uStarSpeed * random.y;
        float radius = random.z * uDensity;
        
        vec3 pos = vec3(
            cos(angle) * radius,
            sin(angle) * radius,
            (random.w - 0.5) * 0.2 * radius
        );

        // Mouse repulsion
        float dist = distance(pos.xy, uMouse);
        if (dist < 1.0) {
            float force = (1.0 - dist) * uRepulsion;
            pos.xy += normalize(pos.xy - uMouse) * force;
        }

        vPosition = pos;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (random.w * 3.0 + 1.0) * (300.0 / -mvPosition.z);
    }
`;

const fragment = /* glsl */ `
    precision highp float;
    
    uniform float uTime;
    uniform float uHueShift;
    uniform float uSaturation;
    uniform float uGlowIntensity;
    uniform float uTwinkle;

    varying vec4 vRandom;
    varying vec3 vPosition;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 uv = gl_PointCoord.xy - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        float twinkle = mix(1.0, sin(uTime * 5.0 + vRandom.y * 10.0) * 0.5 + 0.5, uTwinkle);
        
        // Color based on position and hue shift
        float hue = fract(uHueShift / 360.0 + vRandom.x * 0.1);
        vec3 color = hsv2rgb(vec3(hue, uSaturation, 1.0));
        
        float alpha = (1.0 - dist * 2.0) * twinkle * uGlowIntensity;
        gl_FragColor = vec4(color, alpha);
    }
`;

export default function Galaxy({
    hueShift = 280,
    saturation = 0.5,
    starSpeed = 0.3,
    density = 1.2,
    glowIntensity = 0.5,
    twinkleIntensity = 0.6,
    mouseInteraction = true,
    mouseRepulsion = true,
    repulsionStrength = 2.5,
    transparent = true
}) {
    const containerRef = useRef();
    const mouse = useRef(new Vec2(-10, -10));
    const active = useRef(true);

    useEffect(() => {
        const renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false, antialias: true });
        const gl = renderer.gl;
        containerRef.current.appendChild(gl.canvas);

        const camera = new Camera(gl, { fov: 35 });
        camera.position.z = 8;

        const count = 5000;
        const position = new Float32Array(count * 3);
        const offset = new Float32Array(count * 3);
        const random = new Float32Array(count * 4);

        for (let i = 0; i < count; i++) {
            random[i * 4 + 0] = Math.random(); // hue variation
            random[i * 4 + 1] = Math.random(); // speed variation
            random[i * 4 + 2] = Math.random() * 5.0; // radius
            random[i * 4 + 3] = Math.random(); // size/twinkle
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: position },
            random: { size: 4, data: random },
        });

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uStarSpeed: { value: starSpeed },
                uHueShift: { value: hueShift },
                uSaturation: { value: saturation },
                uGlowIntensity: { value: glowIntensity },
                uTwinkle: { value: twinkleIntensity },
                uMouse: { value: mouse.current },
                uRepulsion: { value: repulsionStrength },
                uDensity: { value: density },
            },
            transparent: true,
            depthTest: false,
        });

        const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

        function resize() {
            const width = containerRef.current.offsetWidth;
            const height = containerRef.current.offsetHeight;
            renderer.setSize(width, height);
            camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
        }

        window.addEventListener('resize', resize);
        resize();

        // Mouse handling
        function onMouseMove(e) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Adjust for aspect ratio
            mouse.current.set(x * camera.aspect * 4, y * 4);
        }

        if (mouseInteraction) {
            window.addEventListener('mousemove', onMouseMove);
        }

        // Tab focus logic
        const handleFocus = () => active.current = true;
        const handleBlur = () => active.current = false;
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        let raf;
        function update(t) {
            if (active.current) {
                raf = requestAnimationFrame(update);
                program.uniforms.uTime.value = t * 0.001;
                program.uniforms.uMouse.value = mouse.current;
                renderer.render({ scene: mesh, camera });
            } else {
                raf = requestAnimationFrame(update); // Still run but skip render if you want absolute silence
            }
        }
        raf = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            cancelAnimationFrame(raf);
            gl.canvas.remove();
        };
    }, [hueShift, saturation, starSpeed, density, glowIntensity, twinkleIntensity, mouseInteraction, repulsionStrength, transparent]);

    return <div ref={containerRef} className="w-full h-full" />;
}
