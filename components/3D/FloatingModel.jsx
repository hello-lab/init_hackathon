'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

export function FloatingCube({ scale = 1, speed = 2, rotationIntensity = 0.5 }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.z += delta * 0.1
    }
  })

  return (
    <Float speed={speed} rotationIntensity={rotationIntensity} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={scale}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#ff2fd3" 
          metalness={0.7}
          roughness={0.2}
          emissive="#ff2fd3"
          emissiveIntensity={0.3}
        />
        <meshStandardMaterial 
          color="#ff2fd3"
          wireframe
          emissive="#23e6ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          attach="material-1"
        />
      </mesh>
    </Float>
  )
}


export function FloatingLens({ scale = 1, speed = 1.5 }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.z += delta * 0.4
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={0.4}>
      <mesh ref={meshRef} scale={scale}>
        <torusGeometry args={[1, 0.4, 16, 100]} />
        <meshStandardMaterial 
          color="#12f7c0"
          metalness={0.9}
          roughness={0.05}
          emissive="#12f7c0"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh scale={[0.6, 0.6, 0.6]}>
        <torusGeometry args={[1, 0.4, 16, 100]} />
        <meshStandardMaterial 
          color="#ff2fd3"
          wireframe
          emissive="#ff2fd3"
          emissiveIntensity={0.4}
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  )
}

export function FloatingIcosahedron({ scale = 1, speed = 2 }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.z += delta * 0.15
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial 
          color="#ff2fd3"
          metalness={0.6}
          roughness={0.3}
          emissive="#ff2fd3"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial 
          wireframe
          color="#23e6ff"
          emissive="#23e6ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
    </Float>
  )
}
