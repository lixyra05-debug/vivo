import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Mesh } from 'three';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { BlobBoundary } from './BlobBoundary';
import { BlobSvgFallback } from './BlobSvgFallback';

interface OrganicBlobProps {
  size?: number;
}

interface BlobSceneProps {
  distortRef: { value: number };
  rotRef: { value: { x: number; y: number } };
  staticMode: boolean;
}

function BlobScene({ distortRef, rotRef, staticMode }: BlobSceneProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<{ distort?: number } | null>(null);
  const baseYRotation = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!staticMode) {
      baseYRotation.current += dt * 0.15;
      const t = state.clock.getElapsedTime();
      mesh.scale.setScalar(1 + Math.sin(t * 0.8) * 0.03);
    }

    mesh.rotation.y = baseYRotation.current + rotRef.value.y;
    mesh.rotation.x = rotRef.value.x;

    const material = materialRef.current;
    if (material && typeof distortRef.value === 'number') {
      material.distort = distortRef.value;
    }
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 3, 5]} intensity={0.95} color="#FFFFFF" />
      <pointLight position={[-3, -2, -3]} intensity={0.45} color="#C6D8C6" />
      <Icosahedron args={[1, 8]} ref={meshRef}>
        <MeshDistortMaterial
          ref={materialRef as never}
          color="#8BAD8B"
          distort={0.35}
          speed={2}
          roughness={0.32}
          metalness={0.06}
        />
      </Icosahedron>
    </>
  );
}

function GlBlob({ size }: { size: number }) {
  const distortSV = useSharedValue(0.35);
  const rotSV = useSharedValue<{ x: number; y: number }>({ x: 0, y: 0 });
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []),
  );

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const pan = Gesture.Pan()
    .minDistance(2)
    .onUpdate((event) => {
      'worklet';
      rotSV.value = {
        x: event.translationY * 0.004,
        y: event.translationX * 0.004,
      };
    })
    .onEnd(() => {
      'worklet';
      rotSV.value = { x: 0, y: rotSV.value.y };
    });

  const tap = Gesture.Tap()
    .maxDuration(260)
    .onEnd(() => {
      'worklet';
      runOnJS(triggerHaptic)();
      distortSV.value = withSequence(
        withTiming(0.78, { duration: 180 }),
        withTiming(0.35, { duration: 720 }),
      );
    });

  const composed = Gesture.Simultaneous(pan, tap);

  if (!mounted) {
    return <BlobSvgFallback size={size} />;
  }

  return (
    <GestureDetector gesture={composed}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Sphère organique interactive représentant Vivo"
        accessibilityHint="Glisse pour la faire tourner, touche pour une réaction"
      >
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          frameloop={reduceMotion ? 'demand' : 'always'}
          camera={{ position: [0, 0, 2.9], fov: 50 }}
        >
          <BlobScene
            distortRef={distortSV}
            rotRef={rotSV}
            staticMode={reduceMotion}
          />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

export function OrganicBlob({ size = 340 }: OrganicBlobProps) {
  return (
    <BlobBoundary fallback={<BlobSvgFallback size={size} />}>
      <GlBlob size={size} />
    </BlobBoundary>
  );
}
